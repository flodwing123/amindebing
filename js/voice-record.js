/* =========================================================
   🎙️ 录音 + 语音识别模块 (V2 增强版)
   功能：
   1. Web Speech API 实时语音转文字（中文）
   2. MediaRecorder 音频录制保存（可回放、可持久化）
   3. 录音 UI（计时器、实时文字预览、暂停/继续/停止）
   4. 转写文字自动追加到目标 textarea
   5. ✨ 音频 base64 持久化（保存到 localStorage，刷新不丢）
   6. ✨ 音频大小/时长/下载 支持
   7. 不支持时优雅降级提示

   用法：
   <div id="voiceBar"></div>
   VoiceRecord.bind("voiceBar", "inpStudyRaw", {
     onDone: function(text) {
       // 录音完成后获取音频 base64 用于持久化
       VoiceRecord.getAudioBase64(function(b64) {
         if (b64) mySaveAudio(b64);
       });
     }
   });
   ========================================================= */

const VoiceRecord = (function () {

  /* ---- 内部状态 ---- */
  var rec = null;            // SpeechRecognition 实例
  var mediaRec = null;       // MediaRecorder 实例
  var audioChunks = [];      // 音频数据块
  var stream = null;         // MediaStream
  var timerId = null;        // 计时器
  var seconds = 0;           // 录音秒数
  var paused = false;        // 是否暂停
  var active = false;        // 是否正在录音
  var targetId = null;       // 目标 textarea id
  var onDoneCb = null;       // 录音结束回调
  var finalText = "";        // 已确认的文字
  var interimText = "";      // 临时文字（未确认）
  var containerEl = null;    // 容器元素
  var audioMime = "audio/webm"; // 音频 MIME 类型
  var lastAudioBase64 = null;   // 上次录音的 base64 缓存
  var MAX_AUDIO_BYTES = 2 * 1024 * 1024; // 音频上限 2MB（base64 约 2.7MB）

  /* ---- 兼容性检测 ---- */
  function hasSR() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
  function hasMR() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  /* ---- 检测最佳音频 MIME 类型 ---- */
  function detectMime() {
    if (!hasMR()) return "audio/webm";
    var types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
    for (var i = 0; i < types.length; i++) {
      try {
        if (MediaRecorder.isTypeSupported(types[i])) return types[i];
      } catch (e) {}
    }
    return "audio/webm";
  }

  /* ---- 格式化时间 ---- */
  function fmt(s) {
    var m = Math.floor(s / 60);
    var ss = s % 60;
    return String(m).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
  }

  /* ---- 格式化文件大小 ---- */
  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  }

  /* ---- 渲染录音控制条 HTML ---- */
  function renderBar() {
    if (!hasSR() && !hasMR()) {
      return '<div class="vr-unsupported">⚠️ 当前浏览器不支持语音识别。请使用 Chrome / Edge 浏览器，或手动粘贴文字内容。</div>';
    }
    var audioSize = getAudioSize();
    var sizeWarn = audioSize > MAX_AUDIO_BYTES ? '<span style="color:#E53935;font-size:11px">⚠️ 音频较大(' + fmtSize(audioSize) + ')，建议尽快完成</span>' : '';
    var html = '<div class="vr-bar ' + (active ? "recording" : "") + '" id="vrBar">';
    html += '<div class="vr-left">';
    html += '<button class="vr-btn ' + (active ? "vr-stop" : "vr-start") + '" id="vrToggle">';
    html += (active ? (paused ? "▶️ 继续" : "⏸️ 暂停") : "🎙️ 开始录音");
    html += '</button>';
    if (active) html += '<button class="vr-btn vr-finish" id="vrFinish">⏹️ 完成</button>';
    html += '</div>';
    html += '<div class="vr-right">';
    if (active) {
      html += '<span class="vr-timer" id="vrTimer">' + fmt(seconds) + '</span>';
      html += '<span class="vr-dot ' + (paused ? "paused" : "") + '"></span>';
      if (sizeWarn) html += sizeWarn;
    }
    if (!active && finalText) {
      html += '<span class="vr-done">✅ 上次录音 ' + fmt(seconds) + ' · ' + finalText.length + ' 字' + (audioSize > 0 ? ' · ' + fmtSize(audioSize) : '') + '</span>';
    }
    html += '</div></div>';
    if (active) {
      html += '<div class="vr-preview" id="vrPreview"><span class="vr-final">' + escHtml(finalText) + '</span><span class="vr-interim">' + escHtml(interimText) + '</span></div>';
    }
    return html;
  }

  function escHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---- 刷新 UI ---- */
  function refresh() {
    if (!containerEl) return;
    containerEl.innerHTML = renderBar();
    bindBarEvents();
  }

  /* ---- 绑定按钮事件 ---- */
  function bindBarEvents() {
    var toggle = document.getElementById("vrToggle");
    var finish = document.getElementById("vrFinish");
    if (toggle) toggle.addEventListener("click", toggleRecording);
    if (finish) finish.addEventListener("click", stopRecording);
  }

  /* ---- 开始录音 ---- */
  async function startRecording() {
    finalText = "";
    interimText = "";
    seconds = 0;
    paused = false;
    active = true;
    lastAudioBase64 = null;

    /* 1) 启动语音识别 */
    if (hasSR()) {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      rec = new SR();
      rec.lang = "zh-CN";
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = function (e) {
        var interim = "";
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var r = e.results[i];
          if (r.isFinal) {
            finalText += r[0].transcript;
          } else {
            interim += r[0].transcript;
          }
        }
        interimText = interim;
        updateTextarea();
        updatePreview();
      };

      rec.onerror = function (e) {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          toast("⚠️ 麦克风权限被拒绝，请在浏览器设置中允许");
        } else if (e.error === "no-speech") {
          /* 静默，自动重试 */
        } else if (e.error === "aborted") {
          /* 主动中止，忽略 */
        } else {
          console.warn("SpeechRecognition error:", e.error);
        }
      };

      rec.onend = function () {
        /* 如果还在录音状态，自动重启（浏览器会自动断开） */
        if (active && !paused) {
          try { rec.start(); } catch (e) { /* ignore */ }
        }
      };

      try { rec.start(); } catch (e) { console.warn("SR start failed:", e); }
    }

    /* 2) 同时启动音频录制（低码率压缩，节省存储） */
    if (hasMR()) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        audioMime = detectMime();
        var opts = { audioBitsPerSecond: 16000 }; /* 16kbps 低码率，语音够用 */
        try { opts.mimeType = audioMime; } catch (e) {}
        try {
          mediaRec = new MediaRecorder(stream, opts);
        } catch (e) {
          mediaRec = new MediaRecorder(stream); /* 降级：不指定参数 */
        }
        mediaRec.ondataavailable = function (e) {
          if (e.data && e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRec.start(1000); /* 每秒收集一次 */
      } catch (e) {
        console.warn("MediaRecorder failed:", e);
        /* 语音识别可能仍在工作，不阻止 */
      }
    }

    /* 3) 启动计时器 */
    timerId = setInterval(function () {
      if (!paused) {
        seconds++;
        var t = document.getElementById("vrTimer");
        if (t) t.textContent = fmt(seconds);
        /* 超过 10 分钟自动停止 */
        if (seconds >= 600) {
          toast("⏹️ 录音已达 10 分钟上限，自动停止");
          stopRecording();
        }
      }
    }, 1000);

    refresh();
    toast("🎙️ 录音开始，请说话…");
  }

  /* ---- 暂停/继续 ---- */
  function toggleRecording() {
    if (!active) {
      startRecording();
      return;
    }
    if (paused) {
      /* 继续 */
      paused = false;
      if (rec && rec.state !== "running") { try { rec.start(); } catch (e) {} }
      if (mediaRec && mediaRec.state === "paused") mediaRec.resume();
      toast("▶️ 继续录音");
    } else {
      /* 暂停 */
      paused = true;
      if (rec) { try { rec.stop(); } catch (e) {} }
      if (mediaRec && mediaRec.state === "recording") mediaRec.pause();
      toast("⏸️ 已暂停");
    }
    refresh();
  }

  /* ---- 停止录音 ---- */
  function stopRecording() {
    active = false;
    paused = false;

    if (timerId) { clearInterval(timerId); timerId = null; }

    if (rec) {
      try { rec.stop(); } catch (e) {}
      rec = null;
    }

    /* 最终确认文字写入 textarea */
    if (interimText) {
      finalText += interimText;
      interimText = "";
      updateTextarea();
    }

    if (mediaRec) {
      try {
        mediaRec.onstop = function () {
          if (stream) {
            stream.getTracks().forEach(function (t) { t.stop(); });
            stream = null;
          }
          /* 音频数据已完整，执行收尾 */
          finalizeStop();
        };
        mediaRec.stop();
      } catch (e) {
        finalizeStop();
      }
      mediaRec = null;
    } else {
      /* 没有 MediaRecorder，直接收尾 */
      finalizeStop();
    }
  }

  /* ---- 录音收尾（音频数据完整后调用） ---- */
  function finalizeStop() {
    refresh();

    var audioSize = getAudioSize();
    var sizeInfo = audioSize > 0 ? " · " + fmtSize(audioSize) : "";

    if (finalText) {
      toast("⏹️ 录音完成 · " + fmt(seconds) + " · " + finalText.length + " 字" + sizeInfo);
    } else {
      toast("⏹️ 录音完成（未识别到语音内容）" + sizeInfo);
    }

    /* 预转换 base64 缓存（异步，不阻塞 UI） */
    if (audioChunks.length > 0) {
      convertToBase64(function (b64) {
        lastAudioBase64 = b64;
      });
    }

    if (onDoneCb) try { onDoneCb(finalText); } catch (e) {}
  }

  /* ---- 更新目标 textarea ---- */
  function updateTextarea() {
    if (!targetId) return;
    var ta = document.getElementById(targetId);
    if (!ta) return;
    /* 在已有内容后追加新识别的文字 */
    var existing = ta.value.trimEnd();
    var newText = finalText.trim();
    if (newText) {
      /* 避免重复追加 */
      if (existing && existing.endsWith(newText.slice(-20))) return;
      if (existing && !existing.includes(newText)) {
        ta.value = existing + "\n" + newText;
      } else if (!existing) {
        ta.value = newText;
      } else {
        /* 已包含部分内容，只追加新增部分 */
        var lastIdx = existing.lastIndexOf(newText.slice(0, 15));
        if (lastIdx === -1) {
          ta.value = existing + "\n" + newText;
        }
      }
    }
  }

  /* ---- 更新实时预览 ---- */
  function updatePreview() {
    var el = document.getElementById("vrPreview");
    if (!el) return;
    el.innerHTML = '<span class="vr-final">' + escHtml(finalText) + '</span><span class="vr-interim">' + escHtml(interimText) + '</span>';
    el.scrollTop = el.scrollHeight;
  }

  /* ---- 获取音频 Blob ---- */
  function getAudioBlob() {
    if (audioChunks.length === 0) return null;
    return new Blob(audioChunks, { type: audioMime });
  }

  /* ---- 获取录音音频 URL（临时，刷新失效） ---- */
  function getAudioUrl() {
    var blob = getAudioBlob();
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }

  /* ---- 将音频转为 base64 data URL（持久化存储用） ---- */
  function convertToBase64(cb) {
    var blob = getAudioBlob();
    if (!blob) { cb(null); return; }
    /* 超过上限不转换，避免 localStorage 爆满 */
    if (blob.size > MAX_AUDIO_BYTES) {
      console.warn("Audio too large for localStorage:", blob.size);
      cb(null);
      return;
    }
    var reader = new FileReader();
    reader.onloadend = function () {
      try { cb(reader.result); } catch (e) { cb(null); }
    };
    reader.onerror = function () { cb(null); };
    reader.readAsDataURL(blob);
  }

  /* ---- 获取音频大小（字节） ---- */
  function getAudioSize() {
    if (audioChunks.length === 0) return 0;
    return audioChunks.reduce(function (s, c) { return s + (c.size || 0); }, 0);
  }

  /* ---- 获取音频 MIME 扩展名 ---- */
  function getAudioExt() {
    if (audioMime.indexOf("mp4") >= 0) return "m4a";
    if (audioMime.indexOf("ogg") >= 0) return "ogg";
    return "webm";
  }

  /* ---- 公开 API ---- */
  return {
    /**
     * 绑定录音控制条到容器
     * @param {string} containerId - 容器元素 id
     * @param {string} textareaId - 目标 textarea id
     * @param {object} opts - { onDone: callback(text) }
     */
    bind: function (containerId, textareaId, opts) {
      containerEl = document.getElementById(containerId);
      targetId = textareaId;
      onDoneCb = (opts && opts.onDone) || null;
      active = false;
      paused = false;
      seconds = 0;
      finalText = "";
      interimText = "";
      lastAudioBase64 = null;
      audioChunks = [];
      refresh();
    },
    /**
     * 销毁录音实例
     */
    destroy: function () {
      if (active) stopRecording();
      containerEl = null;
      targetId = null;
      onDoneCb = null;
    },
    /**
     * 获取音频回放 URL（临时 blob URL，刷新失效）
     */
    getAudioUrl: getAudioUrl,
    /**
     * 获取音频 base64 data URL（用于持久化存储到 localStorage）
     * @param {function} cb - 回调函数，参数为 base64 字符串或 null
     */
    getAudioBase64: function (cb) {
      /* 优先返回缓存的 base64 */
      if (lastAudioBase64) { cb(lastAudioBase64); return; }
      convertToBase64(cb);
    },
    /**
     * 获取音频大小（字节）
     */
    getAudioSize: getAudioSize,
    /**
     * 获取音频大小（格式化字符串）
     */
    getAudioSizeText: function () { return fmtSize(getAudioSize()); },
    /**
     * 获取录音时长（秒）
     */
    getDuration: function () { return seconds; },
    /**
     * 获取音频文件扩展名
     */
    getAudioExt: getAudioExt,
    /**
     * 获取音频 MIME 类型
     */
    getAudioMime: function () { return audioMime; },
    /**
     * 清除音频数据（释放内存）
     */
    clearAudio: function () {
      audioChunks = [];
      lastAudioBase64 = null;
    },
    /**
     * 检测是否支持语音识别
     */
    isSupported: function () { return hasSR() || hasMR(); },
    /**
     * 检测是否支持音频录制
     */
    canRecordAudio: hasMR,
    /**
     * 获取已识别的文字
     */
    getText: function () { return finalText; }
  };
})();
