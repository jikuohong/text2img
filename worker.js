/**
 * Cloudflare Worker - Multi-provider AI Image Generation v2
 *
 * Environment Variables:
 *   PASSWORD   - Access password (comma-separated), leave empty to disable
 *   HF_TOKEN   - Hugging Face API token (optional)
 *   ENHANCE    - Set to "false" to disable prompt enhancement globally
 */

const HTML = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI 文生图 · Cloudflare Workers</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f7f6f2;
  --surface:#faf9f6;
  --surface2:#f0ede6;
  --border:#e5e0d8;
  --border2:#d8d2c8;
  --text:#1c1a17;
  --text2:#403c35;
  --muted:#8c8780;
  --muted2:#b8b2aa;
  --accent:#c96a2c;
  --accent-h:#b35e26;
  --accent-bg:rgba(201,106,44,.09);
  --accent-ring:rgba(201,106,44,.22);
  --sw:218px;
  --r:8px;
  --r-sm:5px;
  --sh:0 1px 2px rgba(0,0,0,.05),0 0 0 1px rgba(0,0,0,.04);
  --shl:0 4px 20px rgba(0,0,0,.09),0 1px 4px rgba(0,0,0,.06);
  --f:'Source Sans 3',-apple-system,'Helvetica Neue',sans-serif;
  --fh:'Lora',Georgia,serif;
  --t:.2s ease;
}
html.dark{
  --bg:#1c1a17;
  --surface:#242018;
  --surface2:#2c2820;
  --border:#38332a;
  --border2:#4a4338;
  --text:#f0ece4;
  --text2:#c8c0b4;
  --muted:#78726a;
  --muted2:#504840;
  --accent:#d9793a;
  --accent-h:#e88844;
  --accent-bg:rgba(217,121,58,.1);
  --accent-ring:rgba(217,121,58,.25);
  --sh:0 1px 3px rgba(0,0,0,.3),0 0 0 1px rgba(0,0,0,.2);
  --shl:0 4px 20px rgba(0,0,0,.4),0 1px 4px rgba(0,0,0,.3);
}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{font-family:var(--f);background:var(--bg);color:var(--text);min-height:100vh;display:flex;transition:background var(--t),color var(--t)}

/* ─── SIDEBAR ─── */
#sb{
  width:var(--sw);min-height:100vh;background:var(--surface);
  border-right:1px solid var(--border);display:flex;flex-direction:column;
  padding:20px 0;position:fixed;inset:0 auto 0 0;z-index:40;
  transition:background var(--t),border-color var(--t);
}
.sb-logo{
  display:flex;align-items:center;gap:9px;
  padding:0 16px 18px;border-bottom:1px solid var(--border);margin-bottom:10px;
}
.sb-logo-ic{
  width:30px;height:30px;border-radius:50%;background:var(--accent);
  display:flex;align-items:center;justify-content:center;color:#fff;
  font-size:13px;flex-shrink:0;box-shadow:0 2px 6px rgba(201,106,44,.3);
}
.sb-logo-tx{
  font-family:var(--fh);font-size:15px;font-weight:600;color:var(--text);
  letter-spacing:-.01em;
}
.sb-nav{flex:1;padding:0 8px;display:flex;flex-direction:column;gap:1px}
.ni{
  display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:var(--r-sm);
  font-size:13px;font-weight:500;color:var(--muted);cursor:pointer;
  transition:all var(--t);text-decoration:none;border:none;background:none;
  width:100%;text-align:left;
}
.ni:hover{background:var(--surface2);color:var(--text2)}
.ni.active{background:var(--accent-bg);color:var(--accent)}
.ni-ic{width:16px;text-align:center;font-size:12px;flex-shrink:0}
.sb-ft{padding:10px 8px 0;border-top:1px solid var(--border);display:flex;gap:5px}
.ib{
  width:32px;height:32px;border-radius:var(--r-sm);background:none;
  border:1px solid var(--border);color:var(--muted);cursor:pointer;
  display:flex;align-items:center;justify-content:center;font-size:14px;
  line-height:1;transition:all var(--t);box-shadow:var(--sh);
}
.ib i{font-size:14px;line-height:1;display:block}
.ib:hover{background:var(--surface2);color:var(--text);border-color:var(--border2)}
.sec-lbl{
  font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
  color:var(--muted2);padding:4px 16px 6px;
}

/* ─── MAIN ─── */
#main{margin-left:var(--sw);flex:1;display:flex;flex-direction:column;min-height:100vh}
.topbar{
  height:52px;background:var(--surface);border-bottom:1px solid var(--border);
  display:flex;align-items:center;padding:0 22px;gap:10px;
  position:sticky;top:0;z-index:30;
}
.topbar-title{font-family:var(--fh);font-size:15px;font-weight:600;flex:1;color:var(--text)}
.sdot{width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 2px rgba(34,197,94,.2);flex-shrink:0}
.slbl{font-size:12px;color:var(--muted)}
.pcont{padding:22px 22px 40px;flex:1}

/* ─── CARDS ─── */
.card{
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--r);box-shadow:var(--sh);
  transition:background var(--t),border-color var(--t);
}
.ch{padding:14px 18px 0;display:flex;align-items:center;gap:8px;margin-bottom:12px}
.ch-ic{
  width:26px;height:26px;border-radius:var(--r-sm);background:var(--accent-bg);
  display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--accent);
}
.ct{font-size:13.5px;font-weight:600;flex:1;color:var(--text)}
.cb{padding:0 18px 18px}

/* ─── LAYOUT ─── */
.cols{display:grid;grid-template-columns:390px 1fr;gap:18px;align-items:start}
@media(max-width:900px){.cols{grid-template-columns:1fr}#sb{display:none}#main{margin-left:0}}

/* ─── FORM ─── */
label{
  display:block;font-size:11px;font-weight:700;color:var(--muted);
  margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;
}
input[type=text],input[type=password],input[type=number],textarea,select{
  width:100%;background:var(--surface2);border:1px solid var(--border);
  border-radius:var(--r-sm);padding:8px 11px;font-size:13.5px;
  color:var(--text);font-family:var(--f);transition:border-color var(--t),box-shadow var(--t);outline:none;
}
input::placeholder,textarea::placeholder{color:var(--muted2)}
input:focus,textarea:focus,select:focus{
  border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-ring);
}
textarea{resize:vertical;min-height:72px;line-height:1.5}
select{appearance:none;cursor:pointer}
.fr{margin-bottom:13px}
.lr{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.lr label{margin-bottom:0}

/* ─── SLIDER ─── */
.sr{display:flex;align-items:center;gap:9px}
.sv{
  font-size:11.5px;font-weight:600;color:var(--accent);background:var(--accent-bg);
  padding:2px 8px;border-radius:20px;min-width:52px;text-align:center;white-space:nowrap;
  border:1px solid var(--accent-ring);
}
input[type=range]{
  -webkit-appearance:none;flex:1;height:4px;background:var(--border2);
  border-radius:4px;outline:none;cursor:pointer;border:none;padding:0;
}
input[type=range]::-webkit-slider-thumb{
  -webkit-appearance:none;width:15px;height:15px;border-radius:50%;
  background:var(--accent);cursor:pointer;box-shadow:0 1px 4px rgba(201,106,44,.4);
  transition:transform .15s;
}
input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.15)}

/* ─── BUTTONS ─── */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  padding:8px 14px;border-radius:var(--r-sm);font-size:13px;font-weight:500;
  cursor:pointer;transition:all var(--t);border:none;font-family:var(--f);white-space:nowrap;
}
.btn:focus{outline:none}
.bp{background:var(--accent);color:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12)}
.bp:hover{background:var(--accent-h);transform:translateY(-1px);box-shadow:0 3px 8px rgba(0,0,0,.15)}
.bp:active{transform:translateY(0)}
.bg{background:var(--surface);color:var(--text2);border:1px solid var(--border);box-shadow:var(--sh)}
.bg:hover{background:var(--surface2);border-color:var(--border2)}
.bsm{padding:4px 10px;font-size:12px;border-radius:var(--r-sm);gap:4px}
.bfw{width:100%}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none!important}

/* ─── SIZE PRESETS ─── */
.size-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:5px}
.sz{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:6px 3px;border-radius:var(--r-sm);border:1px solid var(--border);
  background:var(--surface2);cursor:pointer;transition:all var(--t);
  gap:2px;font-size:11px;color:var(--muted);font-weight:500;
}
.sz:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-bg)}
.sz.active{border-color:var(--accent);color:var(--accent);background:var(--accent-bg);font-weight:700}
.sz-icon{font-size:13px;line-height:1}
.sz-label{font-size:10px;font-weight:600;text-align:center}
.sz-dim{font-size:9px;color:var(--muted2);text-align:center}
.sz.active .sz-dim{color:var(--accent)}

/* ─── PROVIDER BADGE ─── */
.pbadge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px}

/* ─── ENHANCE TOGGLE ─── */
.toggle-row{
  display:flex;align-items:center;justify-content:space-between;
  padding:9px 11px;background:var(--surface2);border-radius:var(--r-sm);
  border:1px solid var(--border);cursor:pointer;transition:all var(--t);user-select:none;
}
.toggle-row:hover{border-color:var(--accent)}
.toggle-row.on{border-color:var(--accent);background:var(--accent-bg)}
.tog-info{display:flex;flex-direction:column;gap:2px}
.tog-title{font-size:12.5px;font-weight:600;color:var(--text)}
.tog-sub{font-size:11px;color:var(--muted)}
.tog-switch{
  width:34px;height:19px;border-radius:10px;background:var(--border2);
  position:relative;transition:background .25s;flex-shrink:0;
}
.toggle-row.on .tog-switch{background:var(--accent)}
.tog-switch::after{
  content:'';position:absolute;top:3px;left:3px;
  width:13px;height:13px;border-radius:50%;background:#fff;
  transition:transform .25s;box-shadow:0 1px 3px rgba(0,0,0,.2);
}
.toggle-row.on .tog-switch::after{transform:translateX(15px)}

/* ─── COLLAPSIBLE ─── */
.coll{display:none}
.coll.open{display:block}
.ctog{cursor:pointer;user-select:none}
.cic{transition:transform .25s;font-size:10px;color:var(--muted)}
.ctog.open .cic{transform:rotate(180deg)}
.dvd{border:none;border-top:1px solid var(--border);margin:13px 0}

/* ─── SELECT WRAP ─── */
.selwrap{position:relative}
.selwrap::after{
  content:'\\f078';font-family:'Font Awesome 6 Free';font-weight:900;
  font-size:9px;color:var(--muted2);position:absolute;right:11px;
  top:50%;transform:translateY(-50%);pointer-events:none;
}

/* ─── IMAGE AREA ─── */
#imgArea{
  aspect-ratio:1;background:var(--surface2);border-radius:var(--r);
  border:1.5px dashed var(--border2);display:flex;align-items:center;
  justify-content:center;position:relative;overflow:hidden;
  transition:border-color var(--t),aspect-ratio var(--t);
}
#imgArea.has-img{border-style:solid;border-color:var(--border);cursor:zoom-in}
#aiImg{width:100%;height:100%;object-fit:contain;border-radius:6px;display:none}
#imgPH{text-align:center;color:var(--muted)}
#imgPH i{font-size:32px;margin-bottom:10px;display:block;opacity:.25}
#imgPH p{font-size:13px;font-weight:500}
.ldov{
  position:absolute;inset:0;background:rgba(20,18,15,.75);backdrop-filter:blur(8px);
  display:none;align-items:center;justify-content:center;
  border-radius:6px;flex-direction:column;gap:0;
}
.ldov.show{display:flex}
.spn{
  width:38px;height:38px;border:2.5px solid rgba(255,255,255,.2);
  border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite;
  margin:0 auto 12px;
}
@keyframes spin{to{transform:rotate(360deg)}}
.ldov p{font-size:13px;color:#fff;opacity:.85}
.ldov .sub{font-size:11px;opacity:.5;margin-top:4px}
.ldov .timer{font-size:22px;font-weight:700;color:#fff;font-family:var(--fh);margin-top:8px}

/* ─── ENHANCE INDICATOR ─── */
#enhTag{
  display:none;align-items:center;gap:5px;font-size:11px;color:var(--accent);
  background:var(--accent-bg);border:1px solid var(--accent-ring);
  padding:3px 9px;border-radius:20px;margin-top:8px;
}

/* ─── IMAGE META ─── */
.img-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.mb{
  display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:var(--muted);
  background:var(--surface2);border:1px solid var(--border);padding:3px 9px;border-radius:20px;
}
.mb i{font-size:9px;color:var(--accent)}
.mb.retry{color:#b35e26;border-color:var(--accent-ring);background:var(--accent-bg)}
.mb.retry i{color:var(--accent)}

/* ─── HISTORY ─── */
.hist-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:7px;margin-top:10px}
.hist-item{
  aspect-ratio:1;border-radius:var(--r-sm);overflow:hidden;cursor:pointer;
  position:relative;border:1.5px solid var(--border);transition:all var(--t);background:var(--surface2);
}
.hist-item:hover{border-color:var(--accent);transform:scale(1.03)}
.hist-item img{width:100%;height:100%;object-fit:cover}
.hist-item .hi-del{
  position:absolute;top:3px;right:3px;width:17px;height:17px;border-radius:50%;
  background:rgba(0,0,0,.6);color:#fff;font-size:8px;
  display:none;align-items:center;justify-content:center;cursor:pointer;
}
.hist-item:hover .hi-del{display:flex}
.hist-empty{text-align:center;color:var(--muted);font-size:12.5px;padding:20px 0}

/* ─── PARAMS PANEL ─── */
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:5px;margin-top:7px}
.pc{background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-sm);padding:6px 9px;font-size:11.5px}
.pc .pk{color:var(--muted);display:block;margin-bottom:1px;font-size:9.5px;text-transform:uppercase;letter-spacing:.05em}
.pc .pv{color:var(--text2);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.pc.orig{border-color:var(--accent-ring);background:var(--accent-bg)}
.pc.orig .pk{color:var(--accent)}

/* ─── DOWNLOAD STRIP ─── */
#dlStrip{
  display:none;margin-top:12px;padding:11px 13px;
  background:var(--surface2);border:1px solid var(--border);
  border-radius:var(--r);align-items:center;gap:11px;
}
#dlStrip.show{display:flex}
.dl-thumb{width:44px;height:44px;border-radius:var(--r-sm);object-fit:cover;flex-shrink:0;border:1px solid var(--border)}
.dl-info{flex:1;min-width:0}
.dl-name{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text)}
.dl-meta{font-size:11px;color:var(--muted);margin-top:2px}
.dl-btn{
  display:inline-flex;align-items:center;gap:6px;padding:7px 13px;
  border-radius:var(--r-sm);background:var(--accent);color:#fff;
  font-size:12.5px;font-weight:500;text-decoration:none;white-space:nowrap;
  box-shadow:0 1px 3px rgba(0,0,0,.12);transition:all var(--t);flex-shrink:0;
}
.dl-btn:hover{background:var(--accent-h);transform:translateY(-1px)}

/* ─── TOAST ─── */
#toast{
  position:fixed;bottom:20px;right:20px;padding:9px 14px;border-radius:var(--r);
  font-size:13px;font-weight:500;display:flex;align-items:center;gap:7px;
  box-shadow:var(--shl);transform:translateY(14px);opacity:0;
  transition:all .25s cubic-bezier(.34,1.4,.64,1);z-index:999;pointer-events:none;max-width:320px;
}
#toast.show{transform:translateY(0);opacity:1}
#toast.ok{background:#f0faf3;color:#166534;border:1px solid #bbf0cc}
#toast.err{background:#fef3ee;color:#9a3412;border:1px solid #fcd4bb}
#toast.inf{background:var(--surface);color:var(--text2);border:1px solid var(--border)}
#toast.warn{background:#fef9ee;color:#8a4a10;border:1px solid #f5d4a0}
html.dark #toast.ok{background:#0d3320;color:#6ee79a;border-color:#1a5c38}
html.dark #toast.err{background:#3d1408;color:#fca882;border-color:#7a2a14}
html.dark #toast.warn{background:#3d2208;color:#f5c070;border-color:#7a4a14}

/* ─── LOGIN ─── */
#loginModal{
  position:fixed;inset:0;z-index:100;background:rgba(20,18,15,.72);
  backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;
}
#loginModal.hidden{display:none}
.lc{
  background:var(--surface);border:1px solid var(--border);border-radius:14px;
  box-shadow:var(--shl);padding:38px 34px;width:100%;max-width:360px;text-align:center;
}
.lc-ic{
  width:50px;height:50px;border-radius:50%;background:var(--accent);
  display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;
  margin:0 auto 16px;box-shadow:0 3px 10px rgba(201,106,44,.3);
}
.lc-title{font-family:var(--fh);font-size:20px;font-weight:600;margin-bottom:5px;color:var(--text)}
.lc-sub{font-size:13px;color:var(--muted);margin-bottom:22px}
.lerr{
  display:none;background:#fef3ee;color:#9a3412;border:1px solid #fcd4bb;
  border-radius:var(--r-sm);padding:7px 11px;font-size:12.5px;margin-bottom:11px;text-align:left;
}
html.dark .lerr{background:rgba(154,52,18,.2);color:#fca882;border-color:rgba(154,52,18,.35)}
.lerr.show{display:block}

/* ─── LIGHTBOX ─── */
#lb{
  position:fixed;inset:0;z-index:200;background:rgba(20,18,15,.9);
  backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;
}
#lb.show{display:flex}
#lbImg{max-width:92vw;max-height:92vh;object-fit:contain;border-radius:var(--r);box-shadow:0 24px 64px rgba(0,0,0,.6)}
#lbClose{
  position:absolute;top:18px;right:18px;width:36px;height:36px;
  border-radius:var(--r-sm);background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.18);color:#fff;font-size:14px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;transition:background var(--t);
}
#lbClose:hover{background:rgba(255,255,255,.2)}

.hidden{display:none!important}
</style>
</head>
<body>

<!-- LOGIN -->
<div id="loginModal">
  <div class="lc">
    <div class="lc-ic"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
    <div class="lc-title">AI 文生图</div>
    <div class="lc-sub">Powered by Cloudflare Workers</div>
    <div id="lerr" class="lerr"><i class="fa-solid fa-triangle-exclamation"></i> 密码错误，请重试</div>
    <div class="fr" style="text-align:left">
      <label>访问密码</label>
      <input type="password" id="lp" placeholder="请输入密码…" autocomplete="current-password">
    </div>
    <button class="btn bp bfw" id="lbtn" style="height:40px;font-size:13.5px">
      <i class="fa-solid fa-right-to-bracket"></i> 进入
    </button>
  </div>
</div>

<!-- LIGHTBOX -->
<div id="lb">
  <button id="lbClose"><i class="fa-solid fa-xmark"></i></button>
  <img id="lbImg" src="" alt="">
</div>

<!-- SIDEBAR -->
<aside id="sb">
  <div class="sb-logo">
    <div class="sb-logo-ic"><i class="fa-solid fa-wand-magic-sparkles" style="font-size:11px"></i></div>
    <span class="sb-logo-tx">AI 文生图</span>
  </div>
  <div class="sec-lbl">功能</div>
  <nav class="sb-nav">
    <button class="ni active">
      <span class="ni-ic"><i class="fa-solid fa-wand-magic-sparkles"></i></span>文生图
    </button>
    <button class="ni" id="histNavBtn">
      <span class="ni-ic"><i class="fa-solid fa-clock-rotate-left"></i></span>历史记录
      <span id="histCount" style="margin-left:auto;font-size:10px;background:var(--accent-bg);color:var(--accent);padding:1px 7px;border-radius:10px;border:1px solid var(--accent-ring);display:none">0</span>
    </button>
    <button class="ni" style="opacity:.38;cursor:not-allowed" disabled>
      <span class="ni-ic"><i class="fa-solid fa-image"></i></span>图生图
      <span style="margin-left:auto;font-size:10px;background:var(--surface2);color:var(--muted);padding:1px 7px;border-radius:10px;border:1px solid var(--border)">Soon</span>
    </button>
  </nav>
  <div style="margin-top:12px">
    <div class="sec-lbl">工具</div>
    <nav class="sb-nav">
      <a class="ni" href="https://your-gallery.workers.dev" target="_blank">
        <span class="ni-ic"><i class="fa-solid fa-images"></i></span>AI 图库
        <span style="margin-left:auto;font-size:9px;opacity:.45"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
      </a>
      <a class="ni" href="https://your-image-host.com" target="_blank">
        <span class="ni-ic"><i class="fa-solid fa-photo-film"></i></span>图床
        <span style="margin-left:auto;font-size:9px;opacity:.45"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
      </a>
    </nav>
  </div>
  <div style="flex:1"></div>
  <div class="sb-ft">
    <button class="ib" id="themeToggle" title="切换主题"><i class="fa-solid fa-moon" id="themeIcon"></i></button>
    <button class="ib" id="logoutBtn" title="退出登录"><i class="fa-solid fa-right-from-bracket"></i></button>
  </div>
</aside>

<!-- MAIN -->
<div id="main">
  <div class="topbar">
    <div class="topbar-title">
      <i class="fa-solid fa-wand-magic-sparkles" style="color:var(--accent);margin-right:8px;font-size:13px"></i>文生图
    </div>
    <div class="sdot"></div>
    <span class="slbl">Workers AI 在线</span>
  </div>

  <div class="pcont">
    <div class="cols">

      <!-- LEFT PANEL -->
      <div style="display:flex;flex-direction:column;gap:13px">

        <!-- Basic -->
        <div class="card">
          <div class="ch">
            <div class="ch-ic"><i class="fa-solid fa-sliders"></i></div>
            <span class="ct">基本设置</span>
            <button class="btn bg bsm" id="randomBtn"><i class="fa-solid fa-dice"></i> 随机</button>
          </div>
          <div class="cb">
            <div class="fr">
              <label>正向提示词</label>
              <textarea id="prompt" rows="3" placeholder="描述想生成的图像内容… 支持中文，开启增强自动翻译优化"></textarea>
            </div>
            <div class="fr">
              <label>反向提示词</label>
              <textarea id="neg" rows="2" placeholder="描述要排除的内容…"></textarea>
            </div>
            <div class="fr">
              <label>文生图模型</label>
              <div class="selwrap">
                <select id="model"><option value="loading" disabled selected>加载中…</option></select>
              </div>
              <div id="pvinfo" style="margin-top:7px;display:none;align-items:center;gap:6px">
                <span id="pvbadge" class="pbadge"></span>
                <span id="pvnote" style="font-size:11px;color:var(--muted)"></span>
              </div>
            </div>
            <!-- Enhance toggle -->
            <div class="fr" style="margin-bottom:0">
              <label>提示词增强</label>
              <div class="toggle-row" id="enhToggle">
                <div class="tog-info">
                  <span class="tog-title">✨ AI 自动增强 &amp; 翻译</span>
                  <span class="tog-sub">用 Llama 3.1 扩写提示词，中文自动转英文</span>
                </div>
                <div class="tog-switch"></div>
              </div>
              <div id="enhTag"><i class="fa-solid fa-sparkles"></i> 提示词已增强</div>
            </div>
          </div>
        </div>

        <!-- Size & Advanced -->
        <div class="card">
          <div class="ch ctog" id="advToggle">
            <div class="ch-ic"><i class="fa-solid fa-gear"></i></div>
            <span class="ct">尺寸 &amp; 高级选项</span>
            <i class="fa-solid fa-chevron-down cic"></i>
          </div>
          <div class="cb coll" id="advBody">
            <!-- Size presets -->
            <div class="fr">
              <label>快速尺寸</label>
              <div class="size-grid" id="sizeGrid">
                <div class="sz active" data-w="1024" data-h="1024">
                  <span class="sz-icon">⬛</span>
                  <span class="sz-label">正方形</span>
                  <span class="sz-dim">1024×1024</span>
                </div>
                <div class="sz" data-w="1920" data-h="1080">
                  <span class="sz-icon">🖥️</span>
                  <span class="sz-label">横屏 16:9</span>
                  <span class="sz-dim">1920×1080</span>
                </div>
                <div class="sz" data-w="1080" data-h="1920">
                  <span class="sz-icon">📱</span>
                  <span class="sz-label">竖屏 9:16</span>
                  <span class="sz-dim">1080×1920</span>
                </div>
                <div class="sz" data-w="1200" data-h="630">
                  <span class="sz-icon">🌐</span>
                  <span class="sz-label">封面图</span>
                  <span class="sz-dim">1200×630</span>
                </div>
                <div class="sz" data-w="1080" data-h="1080">
                  <span class="sz-icon">📷</span>
                  <span class="sz-label">Instagram</span>
                  <span class="sz-dim">1080×1080</span>
                </div>
                <div class="sz" data-w="1500" data-h="500">
                  <span class="sz-icon">🐦</span>
                  <span class="sz-label">Twitter 封面</span>
                  <span class="sz-dim">1500×500</span>
                </div>
                <div class="sz" data-w="2560" data-h="1440">
                  <span class="sz-icon">🖼️</span>
                  <span class="sz-label">壁纸 2K</span>
                  <span class="sz-dim">2560×1440</span>
                </div>
                <div class="sz" data-w="512" data-h="512">
                  <span class="sz-icon">⚡</span>
                  <span class="sz-label">极速小图</span>
                  <span class="sz-dim">512×512</span>
                </div>
              </div>
            </div>
            <hr class="dvd">
            <div class="fr">
              <div class="lr"><label>宽度</label><span class="sv" id="wv">1024px</span></div>
              <input type="range" id="width" min="256" max="2048" step="64" value="1024">
            </div>
            <div class="fr">
              <div class="lr"><label>高度</label><span class="sv" id="hv">1024px</span></div>
              <input type="range" id="height" min="256" max="2048" step="64" value="1024">
            </div>
            <div class="fr">
              <div class="lr"><label>迭代步数</label><span class="sv" id="stv">20</span></div>
              <input type="range" id="steps" min="1" max="50" step="1" value="20">
            </div>
            <div class="fr">
              <div class="lr"><label>引导系数</label><span class="sv" id="guv">7.50</span></div>
              <input type="range" id="guidance" min="0" max="30" step="0.5" value="7.5">
            </div>
            <div class="fr" style="margin-bottom:0">
              <div class="lr">
                <label>随机种子</label>
                <button class="btn bg bsm" id="randSeed"><i class="fa-solid fa-shuffle"></i> 随机</button>
              </div>
              <input type="number" id="seed" placeholder="留空则随机">
            </div>
          </div>
        </div>

        <button class="btn bp bfw" id="genBtn" style="height:44px;font-size:14px;border-radius:var(--r)">
          <i class="fa-solid fa-wand-magic-sparkles"></i> 生成图像
        </button>
      </div>

      <!-- RIGHT PANEL -->
      <div style="display:flex;flex-direction:column;gap:13px">

        <!-- Result -->
        <div class="card">
          <div class="ch">
            <div class="ch-ic"><i class="fa-solid fa-image"></i></div>
            <span class="ct">生成结果</span>
            <div style="display:flex;gap:6px;margin-left:auto">
              <button class="btn bg bsm hidden" id="reuseBtn"><i class="fa-solid fa-rotate-right"></i> 重新生成</button>
              <button class="btn bg bsm hidden" id="cpBtn"><i class="fa-solid fa-copy"></i> 参数</button>
              <button class="btn bg bsm hidden" id="dlBtn"><i class="fa-solid fa-download"></i> 下载</button>
            </div>
          </div>
          <div class="cb">
            <div id="imgArea">
              <div id="imgPH">
                <i class="fa-regular fa-image"></i>
                <p>点击「生成图像」开始创作</p>
              </div>
              <img id="aiImg" alt="生成图像">
              <div class="ldov" id="ldov">
                <div class="spn"></div>
                <p>生成中，请稍候…</p>
                <p class="sub">这可能需要几秒到几十秒</p>
                <div class="timer" id="ldTimer">0s</div>
              </div>
            </div>

            <!-- Download strip -->
            <div id="dlStrip">
              <img id="dlThumb" class="dl-thumb" src="" alt="">
              <div class="dl-info">
                <div class="dl-name" id="dlName">生成图像.png</div>
                <div class="dl-meta" id="dlMeta">点击右侧按钮下载到本地</div>
              </div>
              <div style="display:flex;gap:6px;flex-shrink:0">
                <a id="dlLink" class="dl-btn" href="#" download="ai-image.png">
                  <i class="fa-solid fa-download"></i> 下载
                </a>
              </div>
            </div>

            <!-- Image host URL strip -->
            <div id="hostStrip" style="display:none;margin-top:8px;padding:8px 11px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-sm);align-items:center;gap:8px">
              <i class="fa-solid fa-link" style="color:var(--accent);font-size:11px;flex-shrink:0"></i>
              <span style="font-size:11px;color:var(--muted);flex-shrink:0;font-weight:600">图床直链</span>
              <input id="hostUrl" type="text" readonly style="flex:1;font-size:12px;padding:4px 8px;border-radius:var(--r-sm);background:var(--surface);border:1px solid var(--border);color:var(--text);cursor:text;min-width:0" value="">
              <button id="copyHostUrl" class="btn bg bsm" style="flex-shrink:0;gap:4px">
                <i class="fa-solid fa-copy"></i> 复制
              </button>
              <a id="openHostUrl" href="#" target="_blank" class="btn bg bsm" style="flex-shrink:0;gap:4px;text-decoration:none">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            </div>

            <div id="enhTag"><i class="fa-solid fa-sparkles"></i> 提示词已由 AI 增强优化</div>
            <div class="img-meta hidden" id="imgMeta">
              <span class="mb"><i class="fa-regular fa-clock"></i><span id="genTime">-</span></span>
              <span class="mb"><i class="fa-solid fa-microchip"></i><span id="usedMdl">-</span></span>
              <span class="mb hidden retry" id="retryBadge"><i class="fa-solid fa-rotate-right"></i>已自动重试</span>
            </div>
            <div id="paramsP" class="hidden">
              <hr class="dvd">
              <div style="font-size:10.5px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">
                <i class="fa-solid fa-list-check" style="margin-right:5px;color:var(--accent)"></i>生成参数
              </div>
              <div class="pgrid" id="pgrid"></div>
            </div>
          </div>
        </div>

        <!-- History -->
        <div class="card" id="histCard" style="display:none">
          <div class="ch">
            <div class="ch-ic"><i class="fa-solid fa-clock-rotate-left"></i></div>
            <span class="ct">历史记录</span>
            <button class="btn bg bsm" id="clearHistBtn" style="margin-left:auto">
              <i class="fa-solid fa-trash"></i> 清空
            </button>
          </div>
          <div class="cb">
            <div class="hist-grid" id="histGrid"></div>
          </div>
        </div>

      </div>
    </div>
  </div>
</div>

<div id="toast"></div>

<script>
(function(){
'use strict';
var models=[],prompts=[],curParams=null,enhOn=false,genTimer=null;

// ── Theme ──────────────────────────────────────────────────────────────────
var html=document.documentElement;
var thIcon=document.getElementById('themeIcon');
var saved=localStorage.getItem('theme');
if(saved==='dark'||(!saved&&matchMedia('(prefers-color-scheme:dark)').matches)){html.classList.add('dark');thIcon.className='fa-solid fa-sun';}
document.getElementById('themeToggle').addEventListener('click',function(){
  var d=html.classList.toggle('dark');
  localStorage.setItem('theme',d?'dark':'light');
  thIcon.className=d?'fa-solid fa-sun':'fa-solid fa-moon';
});

// ── Toast ──────────────────────────────────────────────────────────────────
var toastT;
function toast(msg,type){
  type=type||'inf';
  var t=document.getElementById('toast');
  clearTimeout(toastT);
  var icons={ok:'fa-circle-check',err:'fa-circle-exclamation',inf:'fa-circle-info',warn:'fa-triangle-exclamation'};
  t.innerHTML='<i class="fa-solid '+(icons[type]||icons.inf)+'"></i> '+msg;
  t.className='show '+type;
  toastT=setTimeout(function(){t.classList.remove('show');},4500);
}

// ── Login ──────────────────────────────────────────────────────────────────
var loginModal=document.getElementById('loginModal');
var lerr=document.getElementById('lerr');
var lpEl=document.getElementById('lp');
if(sessionStorage.getItem('apw')!==null)loginModal.classList.add('hidden');

async function doLogin(){
  var pwd=lpEl.value.trim();
  lerr.classList.remove('show');
  var res=await fetch('/',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({password:pwd,prompt:'__check__',model:'pol-flux'})
  }).catch(function(){return null;});
  if(res&&res.status===403){lerr.classList.add('show');lpEl.focus();return;}
  sessionStorage.setItem('apw',pwd);
  loginModal.classList.add('hidden');
}
document.getElementById('lbtn').addEventListener('click',doLogin);
lpEl.addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
document.getElementById('logoutBtn').addEventListener('click',function(){
  sessionStorage.removeItem('apw');
  loginModal.classList.remove('hidden');
  lpEl.value='';lerr.classList.remove('show');
});

// ── Lightbox ───────────────────────────────────────────────────────────────
var lb=document.getElementById('lb');
var lbImg=document.getElementById('lbImg');
var aiImg=document.getElementById('aiImg');
aiImg.addEventListener('click',function(){
  if(!aiImg.src||aiImg.style.display==='none')return;
  lbImg.src=aiImg.src;lb.classList.add('show');
});
document.getElementById('lbClose').addEventListener('click',function(){lb.classList.remove('show');});
lb.addEventListener('click',function(e){if(e.target===lb)lb.classList.remove('show');});
document.addEventListener('keydown',function(e){if(e.key==='Escape')lb.classList.remove('show');});

// ── Enhance toggle ─────────────────────────────────────────────────────────
var enhToggle=document.getElementById('enhToggle');
enhToggle.addEventListener('click',function(){
  enhOn=!enhOn;
  enhToggle.classList.toggle('on',enhOn);
});

// ── Collapsible ────────────────────────────────────────────────────────────
var advT=document.getElementById('advToggle'),advB=document.getElementById('advBody');
advT.addEventListener('click',function(){advB.classList.toggle('open');advT.classList.toggle('open');});

// ── Size presets ───────────────────────────────────────────────────────────
var szBtns=document.querySelectorAll('.sz');
function setSizePreset(w,h){
  document.getElementById('width').value=w;
  document.getElementById('height').value=h;
  document.getElementById('wv').textContent=w+'px';
  document.getElementById('hv').textContent=h+'px';
  var area=document.getElementById('imgArea');
  var ratio=w/h;
  area.style.aspectRatio=ratio>0?ratio+'/1':'1';
}
szBtns.forEach(function(b){
  b.addEventListener('click',function(){
    szBtns.forEach(function(x){x.classList.remove('active');});
    b.classList.add('active');
    setSizePreset(parseInt(b.dataset.w),parseInt(b.dataset.h));
  });
});

// ── Sliders ────────────────────────────────────────────────────────────────
function sl(id,vid,fmt){
  var el=document.getElementById(id),vl=document.getElementById(vid);
  el.addEventListener('input',function(){
    vl.textContent=fmt(el.value);
    if(id==='width'||id==='height')szBtns.forEach(function(x){x.classList.remove('active');});
  });
}
sl('width','wv',function(v){return v+'px';});
sl('height','hv',function(v){return v+'px';});
sl('steps','stv',function(v){return v;});
sl('guidance','guv',function(v){return parseFloat(v).toFixed(2);});
document.getElementById('randSeed').addEventListener('click',function(){
  document.getElementById('seed').value=Math.floor(Math.random()*4294967295);
});

// ── Provider badge ─────────────────────────────────────────────────────────
var PV_CFG={
  cloudflare:{label:'Cloudflare AI',icon:'fa-cloud',bg:'rgba(201,106,44,.1)',color:'var(--accent)',note:'已绑定 Workers AI，免费额度内无需额外配置'},
  pollinations:{label:'Pollinations AI',icon:'fa-seedling',bg:'rgba(34,197,94,.1)',color:'#16a34a',note:'完全免费，无需 API Key，直接调用'},
  huggingface:{label:'HuggingFace',icon:'fa-robot',bg:'rgba(251,191,36,.1)',color:'#b45309',note:'需在 Worker 中设置 HF_TOKEN 环境变量'},
};
function updatePvBadge(id){
  var m=models.find(function(x){return x.id===id;});
  var el=document.getElementById('pvinfo');
  if(!m){el.style.display='none';return;}
  var cfg=PV_CFG[m.provider]||{label:m.provider,icon:'fa-circle',bg:'',color:'var(--muted)',note:''};
  var b=document.getElementById('pvbadge');
  b.innerHTML='<i class="fa-solid '+cfg.icon+'"></i> '+cfg.label;
  b.style.background=cfg.bg;b.style.color=cfg.color;
  b.style.border='1px solid '+cfg.bg.replace('.1)','.25)');
  b.style.padding='2px 9px';b.style.borderRadius='20px';
  document.getElementById('pvnote').textContent=cfg.note;
  el.style.display='flex';
}

// ── Load models ────────────────────────────────────────────────────────────
async function loadModels(){
  try{
    var r=await fetch('/api/models');models=await r.json();
    var sel=document.getElementById('model');sel.innerHTML='';
    var groups={cloudflare:[],pollinations:[],huggingface:[]};
    models.forEach(function(m){(groups[m.provider]||(groups[m.provider]=[])).push(m);});
    var glbls={cloudflare:'☁️ Cloudflare Workers AI',pollinations:'🌸 Pollinations AI（免费无需Key）',huggingface:'🤗 HuggingFace Inference'};
    Object.keys(groups).forEach(function(pv){
      if(!groups[pv]||!groups[pv].length)return;
      var og=document.createElement('optgroup');og.label=glbls[pv]||pv;
      groups[pv].forEach(function(m){
        var o=document.createElement('option');o.value=m.id;
        o.textContent=m.name+' — '+m.description;og.appendChild(o);
      });
      sel.appendChild(og);
    });
    var defM=models.find(function(m){return m.id==='cf-flux-schnell';});
    if(defM)sel.value=defM.id;
    updatePvBadge(sel.value);
    sel.addEventListener('change',function(){updatePvBadge(sel.value);});
  }catch(e){toast('加载模型失败','err');}
}
async function loadPrompts(){
  try{
    var r=await fetch('/api/prompts');prompts=await r.json();
    if(prompts.length){
      var el=document.getElementById('prompt');
      if(!el.value)el.value=prompts[Math.floor(Math.random()*prompts.length)];
    }
  }catch(e){prompts=[];}
}
loadModels();loadPrompts();

document.getElementById('randomBtn').addEventListener('click',function(){
  if(!prompts.length){toast('提示词列表未加载','err');return;}
  document.getElementById('prompt').value=prompts[Math.floor(Math.random()*prompts.length)];
});

// ── History (IndexedDB) ────────────────────────────────────────────────────
var db=null;
function openDB(){
  return new Promise(function(res,rej){
    var req=indexedDB.open('aiimg_hist',1);
    req.onupgradeneeded=function(e){
      var d=e.target.result;
      if(!d.objectStoreNames.contains('items'))d.createObjectStore('items',{keyPath:'id',autoIncrement:true});
    };
    req.onsuccess=function(e){res(e.target.result);};
    req.onerror=rej;
  });
}
async function getDB(){if(!db)db=await openDB();return db;}
async function histAdd(item){
  var d=await getDB();
  return new Promise(function(res,rej){var tx=d.transaction('items','readwrite');tx.objectStore('items').add(item);tx.oncomplete=res;tx.onerror=rej;});
}
async function histGetAll(){
  var d=await getDB();
  return new Promise(function(res){
    var tx=d.transaction('items','readonly');var req=tx.objectStore('items').getAll();
    req.onsuccess=function(){res(req.result.reverse());};req.onerror=function(){res([]);};
  });
}
async function histDelete(id){
  var d=await getDB();
  return new Promise(function(res,rej){var tx=d.transaction('items','readwrite');tx.objectStore('items').delete(id);tx.oncomplete=res;tx.onerror=rej;});
}
async function histClear(){
  var d=await getDB();
  return new Promise(function(res,rej){var tx=d.transaction('items','readwrite');tx.objectStore('items').clear();tx.oncomplete=res;tx.onerror=rej;});
}

async function renderHistory(){
  var items=await histGetAll();
  var grid=document.getElementById('histGrid');
  var card=document.getElementById('histCard');
  var cnt=document.getElementById('histCount');
  if(!items.length){card.style.display='none';cnt.style.display='none';return;}
  card.style.display='';cnt.style.display='';cnt.textContent=items.length;
  grid.innerHTML='';
  items.forEach(function(item){
    var d=document.createElement('div');d.className='hist-item';d.title=item.prompt||'';
    var img=document.createElement('img');img.src=item.img;img.loading='lazy';
    var del=document.createElement('div');del.className='hi-del';del.innerHTML='<i class="fa-solid fa-xmark"></i>';
    del.addEventListener('click',function(e){e.stopPropagation();histDelete(item.id).then(renderHistory);});
    d.appendChild(img);d.appendChild(del);
    d.addEventListener('click',function(){
      lbImg.src=item.img;lb.classList.add('show');
      if(item.params){
        curParams=item.params;
        renderParams(item.params,item.enhPrompt,item.origPrompt);
        document.getElementById('paramsP').classList.remove('hidden');
        document.getElementById('reuseBtn').classList.remove('hidden');
      }
    });
    grid.appendChild(d);
  });
}

document.getElementById('histNavBtn').addEventListener('click',function(){
  document.getElementById('histCard').scrollIntoView({behavior:'smooth'});
});
document.getElementById('clearHistBtn').addEventListener('click',function(){
  histClear().then(function(){renderHistory();toast('历史记录已清空','inf');});
});
renderHistory();

// ── Generate ───────────────────────────────────────────────────────────────
document.getElementById('genBtn').addEventListener('click',generate);
document.getElementById('reuseBtn').addEventListener('click',function(){if(curParams)generate(true);});

async function generate(reuse){
  var overlay=document.getElementById('ldov');
  var ph=document.getElementById('imgPH');
  var area=document.getElementById('imgArea');
  var enhTagEl=document.getElementById('enhTag');

  aiImg.style.display='none';ph.style.display='';
  area.classList.remove('has-img');overlay.classList.add('show');
  enhTagEl.style.display='none';
  document.getElementById('dlStrip').classList.remove('show');
  document.getElementById('hostStrip').style.display='none';
  document.getElementById('imgMeta').classList.add('hidden');
  document.getElementById('paramsP').classList.add('hidden');
  ['cpBtn','dlBtn','reuseBtn'].forEach(function(id){document.getElementById(id).classList.add('hidden');});
  document.getElementById('retryBadge').classList.add('hidden');
  document.getElementById('genBtn').disabled=true;

  var t0=performance.now();
  var timerEl=document.getElementById('ldTimer');
  clearInterval(genTimer);
  genTimer=setInterval(function(){timerEl.textContent=((performance.now()-t0)/1000).toFixed(1)+'s';},200);

  var params=reuse&&curParams?Object.assign({},curParams,{password:sessionStorage.getItem('apw')||''}):{
    password:sessionStorage.getItem('apw')||'',
    prompt:document.getElementById('prompt').value||prompts[Math.floor(Math.random()*prompts.length)]||'a beautiful landscape',
    negative_prompt:document.getElementById('neg').value||'',
    model:document.getElementById('model').value,
    width:parseInt(document.getElementById('width').value)||1024,
    height:parseInt(document.getElementById('height').value)||1024,
    num_steps:parseInt(document.getElementById('steps').value)||20,
    guidance:parseFloat(document.getElementById('guidance').value)||7.5,
    seed:parseInt(document.getElementById('seed').value)||Math.floor(Math.random()*4294967295),
    enhance:enhOn,
  };
  if(!reuse)curParams=Object.assign({},params);

  try{
    var res=await fetch('/',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'image/*'},
      body:JSON.stringify(params),
    });

    clearInterval(genTimer);
    var elapsed=((performance.now()-t0)/1000).toFixed(2);

    if(!res.ok){
      var ct=res.headers.get('content-type')||'';
      var errData=ct.includes('json')?await res.json():{error:'生成失败'};
      if(errData.loading){toast('模型加载中，请 30 秒后重试 ⏳','warn');throw new Error(errData.error);}
      throw new Error(errData.error||'生成失败');
    }

    var blob=await res.blob();
    var b64=await blobToB64(blob);

    aiImg.src=b64;
    aiImg.onload=function(){
      overlay.classList.remove('show');
      aiImg.style.display='block';ph.style.display='none';
      area.classList.add('has-img');

      var wasEnhanced=res.headers.get('x-enhanced')==='true'||enhOn;
      if(wasEnhanced)enhTagEl.style.display='flex';

      document.getElementById('genTime').textContent=elapsed+' 秒';
      document.getElementById('usedMdl').textContent=getMdlName(params.model);
      document.getElementById('imgMeta').classList.remove('hidden');

      renderParams(params,null,null);
      ['cpBtn','dlBtn','reuseBtn'].forEach(function(id){document.getElementById(id).classList.remove('hidden');});
      document.getElementById('genBtn').disabled=false;

      var dlStrip=document.getElementById('dlStrip');
      var dlLink=document.getElementById('dlLink');
      var dlThumb=document.getElementById('dlThumb');
      var dlName=document.getElementById('dlName');
      var dlMeta=document.getElementById('dlMeta');
      var mdlName=getMdlName(params.model);
      var fname='ai-'+mdlName.replace(/[^a-zA-Z0-9]/g,'-')+'-'+Date.now()+'.png';
      dlThumb.src=b64;dlLink.href=b64;dlLink.download=fname;
      dlName.textContent=fname;
      dlMeta.textContent=params.width+'×'+params.height+' · '+mdlName+' · '+elapsed+'s';
      dlStrip.classList.add('show');

      var imageUrl=res.headers.get('x-image-url');
      var hostStrip=document.getElementById('hostStrip');
      var hostUrlInput=document.getElementById('hostUrl');
      var openHostUrl=document.getElementById('openHostUrl');
      if(imageUrl){
        hostUrlInput.value=imageUrl;openHostUrl.href=imageUrl;
        hostStrip.style.display='flex';
        toast('生成成功，已上传图床 🎨','ok');
      }else{
        hostStrip.style.display='none';
        toast('生成成功 🎨','ok');
      }
      histAdd({img:b64,prompt:params.prompt,params:params,ts:Date.now()}).then(renderHistory).catch(function(){});
    };
  }catch(err){
    clearInterval(genTimer);
    overlay.classList.remove('show');ph.style.display='';
    document.getElementById('genBtn').disabled=false;
    toast(err.message||'生成失败','err');
  }
}

// ── Copy host URL ──────────────────────────────────────────────────────────
document.getElementById('copyHostUrl').addEventListener('click',function(){
  var url=document.getElementById('hostUrl').value;
  if(!url)return;
  navigator.clipboard.writeText(url).then(function(){toast('图床链接已复制','ok');}).catch(function(){
    document.getElementById('hostUrl').select();document.execCommand('copy');toast('图床链接已复制','ok');
  });
});

// ── Copy params ────────────────────────────────────────────────────────────
document.getElementById('cpBtn').addEventListener('click',function(){
  if(!curParams)return;
  var t=Object.entries(curParams).filter(function(kv){return kv[0]!=='password';})
    .map(function(kv){return kv[0]+': '+kv[1];}).join('\\n');
  navigator.clipboard.writeText(t).then(function(){toast('参数已复制','ok');}).catch(function(){toast('复制失败','err');});
});

// ── Download ───────────────────────────────────────────────────────────────
document.getElementById('dlBtn').addEventListener('click',async function(){
  if(!aiImg.src){toast('无可下载图像','err');return;}
  var r=await fetch(aiImg.src);var b=await r.blob();
  var u=URL.createObjectURL(b);var a=document.createElement('a');
  a.href=u;a.download='ai-'+Date.now()+'.png';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);
  toast('下载成功','ok');
});

// ── Helpers ────────────────────────────────────────────────────────────────
function blobToB64(blob){
  return new Promise(function(res,rej){var r=new FileReader();r.onloadend=function(){res(r.result);};r.onerror=rej;r.readAsDataURL(blob);});
}
function getMdlName(id){var m=models.find(function(m){return m.id===id;});return m?m.name:id;}

var PLBLS={prompt:'正向提示词',negative_prompt:'反向提示词',model:'模型',width:'宽度',height:'高度',num_steps:'步数',guidance:'引导系数',seed:'种子'};
function renderParams(params,enhPrompt,origPrompt){
  var g=document.getElementById('pgrid');g.innerHTML='';
  Object.entries(params).forEach(function(kv){
    var k=kv[0],v=kv[1];
    if(k==='password'||k==='enhance')return;
    var c=document.createElement('div');c.className='pc';
    var lbl=PLBLS[k]||k;
    var disp=k==='model'?getMdlName(v):v;
    c.innerHTML='<span class="pk">'+lbl+'</span><span class="pv" title="'+disp+'">'+disp+'</span>';
    g.appendChild(c);
  });
  if(origPrompt&&origPrompt!==params.prompt){
    var c2=document.createElement('div');c2.className='pc orig';
    c2.innerHTML='<span class="pk">原始提示词</span><span class="pv" title="'+origPrompt+'">'+origPrompt+'</span>';
    g.insertBefore(c2,g.firstChild);
  }
  document.getElementById('paramsP').classList.remove('hidden');
}

})();
</script>
</body>
</html>
`;

// ── Models ────────────────────────────────────────────────────────────────────
const CF_MODELS = [
  { id:'cf-flux-dev',      name:'FLUX.1-dev FP8',    description:'旗舰质量 · 细节极佳',    provider:'cloudflare', key:'@cf/black-forest-labs/flux-1-dev-fp8',                      type:'flux-dev' },
  { id:'cf-flux-schnell',  name:'FLUX.1 Schnell',     description:'极速生成 · 质量均衡',    provider:'cloudflare', key:'@cf/black-forest-labs/flux-1-schnell',                       type:'flux-schnell' },
  { id:'cf-sdxl',          name:'Stable Diffusion XL',description:'SDXL 高质量通用',        provider:'cloudflare', key:'@cf/stabilityai/stable-diffusion-xl-base-1.0',              type:'sdxl' },
  { id:'cf-sdxl-lightning',name:'SDXL Lightning',     description:'极速 SDXL 版本',          provider:'cloudflare', key:'@cf/bytedance/stable-diffusion-xl-lightning',               type:'sdxl' },
  { id:'cf-dreamshaper',   name:'DreamShaper 8 LCM',  description:'增强真实感微调模型',      provider:'cloudflare', key:'@cf/lykon/dreamshaper-8-lcm',                               type:'sdxl' },
];

const POLLINATIONS_MODELS = [
  { id:'pol-flux',         name:'FLUX',          description:'免费无需Key · 高质量',   provider:'pollinations', key:'flux' },
  { id:'pol-flux-realism', name:'FLUX Realism',  description:'免费无需Key · 超写实',   provider:'pollinations', key:'flux-realism' },
  { id:'pol-turbo',        name:'Turbo',          description:'免费无需Key · 极速',     provider:'pollinations', key:'turbo' },
  { id:'pol-flux-anime',   name:'FLUX Anime',     description:'免费无需Key · 动漫风格', provider:'pollinations', key:'flux-anime' },
  { id:'pol-flux-3d',      name:'FLUX 3D',        description:'免费无需Key · 3D渲染',   provider:'pollinations', key:'flux-3d' },
];

const HF_MODELS = [
  { id:'hf-flux-dev',     name:'FLUX.1-dev',     description:'需HF_TOKEN · 开源旗舰',   provider:'huggingface', key:'black-forest-labs/FLUX.1-dev' },
  { id:'hf-flux-schnell', name:'FLUX.1-schnell', description:'需HF_TOKEN · 极速FLUX',   provider:'huggingface', key:'black-forest-labs/FLUX.1-schnell' },
  { id:'hf-sdxl',         name:'SDXL',           description:'需HF_TOKEN · Stability AI',provider:'huggingface', key:'stabilityai/stable-diffusion-xl-base-1.0' },
];

const ALL_MODELS = [...CF_MODELS, ...POLLINATIONS_MODELS, ...HF_MODELS];

const RANDOM_PROMPTS = [
  'cyberpunk cat samurai graphic art, blood splattered, beautiful colors',
  '1girl, solo, outdoors, camping, night, mountains, stars, moon, tent, cheerful, happy, forest, river',
  'masterpiece, best quality, 1girl, long blonde hair, blue eyes, forest, flowers, white butterfly, looking at viewer',
  'frost_glass, masterpiece, cute girl wearing red Christmas dress, snowy forest, moonlight, aurora, sharp focus',
  '1girl, hatsune miku, power elements, microphone, vibrant blue color palette, dreamlike atmosphere',
  'cyberpunk cat, neon lights, ultra detailed, dark, rain, at night, cinematic, dystopic',
  'Cyberpunk catgirl with purple hair, leather outfit, glowing blue eyes, cyberpunk alley background',
  'a wide aerial view of a floating elven city in the sky, crystal towers, surrounded by clouds and golden light',
  'masterpiece, 1girl, very long hair, blonde, sunset, cumulonimbus cloud, old tree, sitting in tree',
  'beautiful girl, sniper rifle, dark braided hair, armor, alpine, night, freckles, depth of field',
];

// ── Prompt Enhancement ────────────────────────────────────────────────────────
async function enhancePrompt(originalPrompt, env) {
  try {
    const systemMsg = `You are an expert AI image generation prompt engineer.
Your task: take the user's simple description and rewrite it into a high-quality, detailed English prompt optimized for image generation models like FLUX and Stable Diffusion.

Rules:
- If the input is Chinese, translate it to English first
- Add rich visual details: lighting, composition, style, atmosphere, quality boosters
- Keep the core subject faithful to the original intent
- Output ONLY the enhanced English prompt, nothing else — no explanation, no prefix like "Enhanced:", just the prompt text
- Max 200 words`;

    const resp = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: originalPrompt },
      ],
      max_tokens: 300,
    });

    const enhanced = resp?.response?.trim();
    if (enhanced && enhanced.length > 10) return enhanced;
    return originalPrompt;
  } catch (e) {
    console.error('Prompt enhancement failed:', e);
    return originalPrompt;
  }
}

// ── Main Handler ──────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    try {
      const url  = new URL(request.url);
      const path = url.pathname;
      const host = request.headers.get('host');

      if (path === '/api/models') {
        const list = !!env.HF_TOKEN ? ALL_MODELS : ALL_MODELS.filter(m => m.provider !== 'huggingface');
        return new Response(JSON.stringify(list), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path === '/api/prompts') {
        return new Response(JSON.stringify(RANDOM_PROMPTS), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (request.method === 'POST') {
        const data = await request.json();

        const PASSWORDS = env.PASSWORD ? env.PASSWORD.split(',').map(p => p.trim()).filter(Boolean) : [];
        if (PASSWORDS.length > 0 && (!data.password || !PASSWORDS.includes(data.password))) {
          return new Response(JSON.stringify({ error: '请输入正确的访问密码' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!data.prompt || !data.model) {
          return new Response(JSON.stringify({ error: '缺少必要参数' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const model = ALL_MODELS.find(m => m.id === data.model);
        if (!model) {
          return new Response(JSON.stringify({ error: '无效的模型 ID' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let finalPrompt = data.prompt;
        const shouldEnhance = data.enhance === true && data.prompt !== '__check__' && env.ENHANCE !== 'false';
        if (shouldEnhance) {
          finalPrompt = await enhancePrompt(data.prompt, env);
        }
        data.originalPrompt = data.prompt;
        data.prompt = finalPrompt;

        const generate = () => {
          if (model.provider === 'cloudflare')  return handleCloudflare(model, data, env, corsHeaders);
          if (model.provider === 'pollinations') return handlePollinations(model, data, corsHeaders);
          if (model.provider === 'huggingface') {
            if (!env.HF_TOKEN) return Promise.resolve(
              new Response(JSON.stringify({ error: '未配置 HF_TOKEN' }), {
                status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              })
            );
            return handleHuggingFace(model, data, env.HF_TOKEN, corsHeaders);
          }
        };

        const imgResponse = await withTimeoutRetry(generate, 55000, 1);

        if (imgResponse.ok) {
          const ct = imgResponse.headers.get('content-type') || 'image/png';
          if (ct.startsWith('image/')) {
            const imgBytes = await imgResponse.arrayBuffer();

            let imageUrl = null;
            if (env.GALLERY_URL) {
              try {
                const form = new FormData();
                form.append('file', new Blob([imgBytes], { type: ct }), 'image.png');
                form.append('prompt',         data.prompt);
                form.append('originalPrompt', data.originalPrompt || data.prompt);
                form.append('model',          data.model || '');
                form.append('width',          String(data.width  || 1024));
                form.append('height',         String(data.height || 1024));
                form.append('seed',           String(data.seed   || 0));
                form.append('enhance',        String(data.enhance || false));
                form.append('imageHost',      env.IMAGE_HOST || '');

                const gRes = await fetch(env.GALLERY_URL + '/gallery/ingest', {
                  method: 'POST',
                  headers: { 'X-Password': env.PASSWORD ? env.PASSWORD.split(',')[0].trim() : '' },
                  body: form,
                });

                if (gRes.ok) {
                  const gJson = await gRes.json();
                  imageUrl = gJson.imageUrl || null;
                } else {
                  console.error('[gallery] ingest failed:', gRes.status);
                }
              } catch (e) {
                console.error('[gallery] ingest error:', e.message);
              }
            } else if (env.IMAGE_HOST) {
              imageUrl = await uploadToImageHost(imgBytes, ct, env.IMAGE_HOST);
            }

            const newHeaders = new Headers({ 'content-type': ct });
            newHeaders.set('Access-Control-Allow-Origin', '*');
            newHeaders.set('Access-Control-Expose-Headers', 'x-image-url');
            if (imageUrl) newHeaders.set('x-image-url', imageUrl);
            return new Response(imgBytes, { status: 200, headers: newHeaders });
          }
        }

        return imgResponse;
      }

      if (request.method === 'GET' && (path === '/' || path.endsWith('.html'))) {
        return new Response(HTML.replace(/{{host}}/g, host), {
          status: 200, headers: { ...corsHeaders, 'content-type': 'text/html' },
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (err) {
      console.error('Worker error:', err);
      return new Response(JSON.stringify({ error: '服务器内部错误', details: err.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

// ── Upload to Image Host ──────────────────────────────────────────────────────
async function uploadToImageHost(imageBytes, contentType, hostUrl) {
  try {
    const form = new FormData();
    const blob = new Blob([imageBytes], { type: contentType || 'image/png' });
    form.append('file', blob, 'image.png');
    const res = await fetch(hostUrl + '/upload', { method: 'POST', body: form });
    if (!res.ok) throw new Error(`图床返回 ${res.status}`);
    const json = await res.json();
    const src = Array.isArray(json) ? json[0]?.src : json?.src;
    if (!src) throw new Error('图床响应中无 src 字段');
    return src.startsWith('http') ? src : hostUrl + src;
  } catch (e) {
    console.error('Upload to image host failed:', e);
    return null;
  }
}

// ── Timeout + Retry ───────────────────────────────────────────────────────────
async function withTimeoutRetry(fn, timeoutMs, retries) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const result = await fn();
      clearTimeout(timer);
      return result;
    } catch (e) {
      clearTimeout(timer);
      if (attempt === retries) {
        return new Response(JSON.stringify({ error: `请求超时或失败，已重试 ${retries} 次`, details: e.message }), {
          status: 504, headers: { 'Content-Type': 'application/json' },
        });
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// ── Cloudflare Workers AI ─────────────────────────────────────────────────────
async function handleCloudflare(model, data, env, corsHeaders) {
  let inputs;
  const type = model.type;

  if (type === 'flux-dev') {
    inputs = { prompt: data.prompt, num_steps: Math.min(50, Math.max(4, data.num_steps || 28)) };
  } else if (type === 'flux-schnell') {
    inputs = { prompt: data.prompt, steps: Math.min(8, Math.max(4, data.num_steps || 6)) };
  } else {
    inputs = {
      prompt: data.prompt, negative_prompt: data.negative_prompt || '',
      height: data.height || 1024, width: data.width || 1024,
      num_steps: data.num_steps || 20, strength: 0.1,
      guidance: data.guidance || 7.5,
      seed: data.seed || Math.floor(Math.random() * 1048576),
    };
  }

  try {
    const response = await env.AI.run(model.key, inputs);
    if (type === 'flux-dev' || type === 'flux-schnell') {
      const json = typeof response === 'object' ? response : JSON.parse(response);
      if (!json.image) throw new Error('响应中无图像数据');
      const binary = atob(json.image);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new Response(bytes, { headers: { ...corsHeaders, 'content-type': 'image/png' } });
    }
    return new Response(response, { headers: { ...corsHeaders, 'content-type': 'image/png' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Cloudflare AI 生成失败', details: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// ── Pollinations AI ───────────────────────────────────────────────────────────
async function handlePollinations(model, data, corsHeaders) {
  try {
    const seed = data.seed || Math.floor(Math.random() * 999983);
    const url  = `https://image.pollinations.ai/prompt/${encodeURIComponent(data.prompt)}`
      + `?model=${model.key}&width=${data.width||1024}&height=${data.height||1024}`
      + `&seed=${seed}&nologo=true&enhance=false`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`Pollinations 返回 ${res.status}`);
    return new Response(await res.arrayBuffer(), {
      headers: { ...corsHeaders, 'content-type': res.headers.get('content-type') || 'image/jpeg' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Pollinations 生成失败', details: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// ── HuggingFace Inference ─────────────────────────────────────────────────────
async function handleHuggingFace(model, data, token, corsHeaders) {
  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${model.key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'image/png' },
      body: JSON.stringify({
        inputs: data.prompt,
        parameters: {
          negative_prompt: data.negative_prompt || '',
          width: data.width || 1024, height: data.height || 1024,
          num_inference_steps: data.num_steps || 20,
          guidance_scale: data.guidance || 7.5,
          seed: data.seed || Math.floor(Math.random() * 4294967295),
        },
      }),
    });
    if (!res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('json')) {
        const err = await res.json();
        if (err.error?.includes('loading')) {
          return new Response(JSON.stringify({ error: '模型冷启动中，请 30 秒后重试', loading: true }), {
            status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error(err.error || `HF ${res.status}`);
      }
      throw new Error(`HF 返回 ${res.status}`);
    }
    return new Response(await res.arrayBuffer(), {
      headers: { ...corsHeaders, 'content-type': res.headers.get('content-type') || 'image/png' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'HuggingFace 生成失败', details: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
