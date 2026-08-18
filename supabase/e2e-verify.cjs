/* =========================================================
   「啊敏的兵」Supabase 端到端验证脚本（Node 24，原生 fetch）
   用法：node e2e-verify.cjs [email] [password]
   流程：登录/注册 → upsert 写入 → select 读回 → upsert 更新
        → delete 删除 → 登出 → 匿名访问被 RLS 拦截
   要求：node >= 18（原生 fetch + AbortController）
   ========================================================= */
const fs = require('fs');
const path = require('path');

/* ---------- mock localStorage（客户端依赖） ---------- */
global.localStorage = (() => {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => { m.delete(k); },
    clear: () => m.clear()
  };
})();

/* ---------- 加载 sb-config.js + supabase.js（与线上同一份代码） ---------- */
const base = __dirname;
const cfgSrc = fs.readFileSync(path.join(base, '..', 'js', 'sb-config.js'), 'utf8');
const clientSrc = fs.readFileSync(path.join(base, '..', 'js', 'supabase.js'), 'utf8');
const SB = new Function(cfgSrc + '\n' + clientSrc + '\nreturn SB;')();

const EMAIL = process.argv[2] || 'amindebing.verify.e2e@gmail.com';
const PASSWORD = process.argv[3] || 'Amindebing#2026E2E';

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name}${detail !== undefined ? ' => ' + JSON.stringify(detail).slice(0, 300) : ''}`); }
}

async function main() {
  console.log('== 1. 登录（失败则注册新账号） ==');
  let user = null;
  try {
    user = await SB.signIn(EMAIL, PASSWORD);
    console.log('  [INFO] 已有账号登录成功');
  } catch (e) {
    console.log('  [INFO] 登录失败(' + e.message + ')，尝试注册');
    try {
      user = await SB.signUp(EMAIL, PASSWORD);
      console.log('  [INFO] 注册成功（Confirm email 已关，注册即登录）');
    } catch (e2) {
      ok('获取会话', false, e2.message);
      process.exit(1);
    }
  }
  ok('拿到 user.id', !!(user && user.id), user && user.id);
  const uid = user.id;
  console.log('  [INFO] user_id = ' + uid);

  console.log('\n== 2. upsert 写入 2 条（insert 策略） ==');
  const t0 = Date.now();
  const rows = [
    { user_id: uid, key: 'e2e_probe_1', data: { probe: 1, t: t0, msg: '写入-插入' } },
    { user_id: uid, key: 'e2e_probe_2', data: { probe: 2, t: t0, msg: '写入-插入' } }
  ];
  let r = await SB.from('user_sync').upsert(rows).exec();
  ok('写入成功（无 403）', Array.isArray(r), r);

  console.log('\n== 3. select 读回（select 策略） ==');
  r = await SB.from('user_sync').select('key,data').eq('user_id', uid).exec();
  const byKey = {};
  (r || []).forEach(x => { byKey[x.key] = x; });
  ok('读回 2 条', Array.isArray(r) && r.length === 2, r);
  ok('probe_1 数据一致', !!(byKey['e2e_probe_1'] && byKey['e2e_probe_1'].data && byKey['e2e_probe_1'].data.msg === '写入-插入'), byKey['e2e_probe_1']);

  console.log('\n== 4. upsert 更新 probe_1（update 策略 / merge） ==');
  await SB.from('user_sync').upsert([{ user_id: uid, key: 'e2e_probe_1', data: { probe: 1, t: t0, msg: '更新-merge' } }]).exec();
  r = await SB.from('user_sync').select('data').eq('user_id', uid).eq('key', 'e2e_probe_1').exec();
  ok('更新生效（读回为 更新-merge）', !!(r && r.length === 1 && r[0].data && r[0].data.msg === '更新-merge'), r);

  console.log('\n== 5. delete probe_2（delete 策略 / 差集删除） ==');
  await SB.from('user_sync').delete().eq('user_id', uid).eq('key', 'e2e_probe_2').exec();
  r = await SB.from('user_sync').select('key').eq('user_id', uid).exec();
  ok('删除生效，剩 1 条且为 probe_1', Array.isArray(r) && r.length === 1 && r[0].key === 'e2e_probe_1', r);

  console.log('\n== 6. 清理 probe_1 ==');
  await SB.from('user_sync').delete().eq('user_id', uid).eq('key', 'e2e_probe_1').exec();
  r = await SB.from('user_sync').select('key').eq('user_id', uid).exec();
  ok('表内已清空（0 条）', Array.isArray(r) && r.length === 0, r);

  console.log('\n== 7. 登出 ==');
  await SB.signOut();
  ok('本地会话已清空', SB.getSession() === null);

  console.log('\n== 8. 匿名访问（无 token）应被 RLS 拦截 ==');
  try {
    const anon = await SB.from('user_sync').select('key').exec();
    ok('匿名 select 返回空（RLS 过滤）', Array.isArray(anon) && anon.length === 0, anon);
  } catch (e) {
    ok('匿名访问被拒绝', e.status === 401 || e.status === 403, { status: e.status, msg: e.message });
  }

  console.log('\n============================================');
  console.log('结果：' + pass + ' 通过 / ' + fail + ' 失败');
  console.log('============================================');
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error('[FATAL]', e); process.exit(1); });
