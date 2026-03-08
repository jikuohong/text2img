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
  --sw:300px;
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
  padding:0;position:fixed;inset:0 auto 0 0;z-index:40;
  transition:background var(--t),border-color var(--t);
  overflow:hidden;
}
.sb-head{padding:20px 16px 0;flex-shrink:0}
.sb-scroll{flex:1;overflow-y:auto;padding:0 0 8px;display:flex;flex-direction:column}
.sb-scroll::-webkit-scrollbar{width:4px}
.sb-scroll::-webkit-scrollbar-track{background:transparent}
.sb-scroll::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
.sb-foot{flex-shrink:0;padding:10px 12px 16px;border-top:1px solid var(--border)}
.sb-logo{
  display:flex;align-items:center;gap:9px;
  padding:0 0 16px;border-bottom:1px solid var(--border);margin-bottom:10px;
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
  height:54px;background:var(--surface);border-bottom:1px solid var(--border);
  display:flex;align-items:center;padding:0 26px;gap:10px;
  position:sticky;top:0;z-index:30;
}
.topbar-title{font-family:var(--fh);font-size:15px;font-weight:600;flex:1;color:var(--text)}
.sdot{width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 2px rgba(34,197,94,.2);flex-shrink:0}
.slbl{font-size:12px;color:var(--muted)}
.pcont{padding:24px 28px 52px;flex:1}

/* ─── CARDS ─── */
.card{
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--r);box-shadow:var(--sh);
  transition:background var(--t),border-color var(--t);
}
.ch{padding:16px 20px 0;display:flex;align-items:center;gap:8px;margin-bottom:14px}
.ch-ic{
  width:28px;height:28px;border-radius:var(--r-sm);background:var(--accent-bg);
  display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--accent);
}
.ct{font-size:14px;font-weight:600;flex:1;color:var(--text)}
.cb{padding:0 20px 20px}

/* ─── LAYOUT ─── */
.cols{display:block}
@media(max-width:1000px){#sb{display:none}#main{margin-left:0}}

/* ─── FORM ─── */
label{
  display:block;font-size:11px;font-weight:700;color:var(--muted);
  margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;
}
input[type=text],input[type=password],input[type=number],textarea,select{
  width:100%;background:var(--surface2);border:1px solid var(--border);
  border-radius:var(--r-sm);padding:9px 12px;font-size:13.5px;
  color:var(--text);font-family:var(--f);transition:border-color var(--t),box-shadow var(--t);outline:none;
}
input::placeholder,textarea::placeholder{color:var(--muted2)}
input:focus,textarea:focus,select:focus{
  border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-ring);
}
textarea{resize:vertical;min-height:82px;line-height:1.55}
select{appearance:none;cursor:pointer}
.fr{margin-bottom:15px}
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

/* ─── SIDEBAR SETTINGS ─── */
.sb-section{padding:12px 14px;border-top:1px solid var(--border)}
.sb-section-lbl{
  font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:var(--muted2);margin-bottom:8px;
}
.sb-gen-btn{padding:12px 14px 0}
/* size grid 2 cols in sidebar */
.size-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:5px;margin-top:5px}
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

  <!-- Fixed header: logo + nav -->
  <div class="sb-head">
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
      <button class="ni" id="img2imgNavBtn">
        <span class="ni-ic"><i class="fa-solid fa-image"></i></span>图生图
      </button>
    </nav>
  </div>

  <!-- Scrollable settings area -->
  <div class="sb-scroll">
  <!-- 文生图设置 -->
  <div id="t2iSettings">

    <!-- Prompt -->
    <div class="sb-section">
      <div class="sb-section-lbl">提示词</div>
      <div class="fr">
        <label>正向提示词</label>
        <textarea id="prompt" rows="3" placeholder="描述想生成的图像内容…"></textarea>
      </div>
      <div class="fr">
        <label>反向提示词</label>
        <textarea id="neg" rows="2" placeholder="描述要排除的内容…"></textarea>
      </div>
    </div>

    <!-- Model + Enhance -->
    <div class="sb-section">
      <div class="sb-section-lbl">模型设置</div>
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
      <div class="fr" style="margin-bottom:0">
        <label>提示词增强</label>
        <div class="toggle-row" id="enhToggle">
          <div class="tog-info">
            <span class="tog-title">✨ AI 自动增强 &amp; 翻译</span>
            <span class="tog-sub">Llama 扩写，中文转英文</span>
          </div>
          <div class="tog-switch"></div>
        </div>
      </div>
    </div>

    <!-- Size & Advanced (collapsible) -->
    <div class="sb-section">
      <div class="sb-section-lbl ctog" id="advToggle" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;margin-bottom:0;padding-bottom:8px">
        尺寸 &amp; 高级选项
        <i class="fa-solid fa-chevron-down cic" style="font-size:9px"></i>
      </div>
      <div class="coll" id="advBody">
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

    <!-- spacer pushes links to bottom -->
    <div style="flex:1"></div>

    <!-- Links at very bottom of scroll area -->
    <div class="sb-section" style="border-top:1px solid var(--border);margin-top:8px">
      <div class="sb-section-lbl">工具链接</div>
      <nav class="sb-nav" style="padding:0">
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

  </div><!-- end t2iSettings -->

  <!-- 图生图设置 -->
  <div id="i2iSettings" style="display:none">

    <div class="sb-section">
      <div class="sb-section-lbl">参考图片</div>
      <div id="i2iDropZone" style="
        border:2px dashed var(--border2);border-radius:var(--r);
        padding:20px 12px;text-align:center;cursor:pointer;
        transition:border-color var(--t),background var(--t);
        background:var(--surface2);position:relative;
      ">
        <input type="file" id="i2iFile" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%">
        <div id="i2iPH">
          <i class="fa-solid fa-cloud-arrow-up" style="font-size:22px;color:var(--muted);margin-bottom:8px;display:block"></i>
          <div style="font-size:12px;color:var(--muted);font-weight:500">点击或拖拽上传图片</div>
          <div style="font-size:10px;color:var(--muted2);margin-top:3px">支持 JPG / PNG / WebP</div>
        </div>
        <img id="i2iPreview" style="display:none;width:100%;border-radius:var(--r-sm);max-height:160px;object-fit:contain">
        <button id="i2iClear" style="display:none;position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;border:none;cursor:pointer;font-size:11px;align-items:center;justify-content:center">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>

    <div class="sb-section">
      <div class="sb-section-lbl">提示词</div>
      <div class="fr">
        <label>描述方向（可选）</label>
        <textarea id="i2iPrompt" rows="3" placeholder="描述想要的风格或内容变化… 留空则保持原图风格"></textarea>
      </div>
      <div class="fr" style="margin-bottom:0">
        <label>反向提示词</label>
        <textarea id="i2iNeg" rows="2" placeholder="描述要排除的内容…"></textarea>
      </div>
    </div>

    <div class="sb-section">
      <div class="sb-section-lbl">参数</div>
      <div class="fr">
        <label>模型 <span style="font-weight:400;text-transform:none;color:var(--muted2)">· FLUX 不支持图生图</span></label>
        <div class="selwrap">
          <select id="i2iModel"></select>
        </div>
      </div>
      <div class="fr">
        <div class="lr"><label>变化强度</label><span class="sv" id="strV">0.75</span></div>
        <input type="range" id="i2iStrength" min="0.1" max="1" step="0.05" value="0.75">
        <div style="font-size:10px;color:var(--muted2);margin-top:4px">越低越接近原图，越高变化越大</div>
      </div>
      <div class="fr">
        <div class="lr"><label>迭代步数</label><span class="sv" id="i2iStV">20</span></div>
        <input type="range" id="i2iSteps" min="1" max="50" step="1" value="20">
      </div>
      <div class="fr" style="margin-bottom:0">
        <div class="lr"><label>引导系数</label><span class="sv" id="i2iGuV">7.50</span></div>
        <input type="range" id="i2iGuidance" min="0" max="30" step="0.5" value="7.5">
      </div>
    </div>

    <!-- spacer + links -->
    <div style="flex:1"></div>
    <div class="sb-section" style="border-top:1px solid var(--border);margin-top:8px">
      <div class="sb-section-lbl">工具链接</div>
      <nav class="sb-nav" style="padding:0">
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

  </div><!-- end i2iSettings -->

  <!-- Fixed footer: generate + theme/logout -->
  <div class="sb-foot">
    <div id="t2iFooter">
      <button class="btn bp bfw" id="genBtn" style="height:42px;font-size:13.5px;border-radius:var(--r);margin-bottom:10px">
        <i class="fa-solid fa-wand-magic-sparkles"></i> 生成图像
      </button>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="btn bg bsm" id="randomBtn" style="flex:1;justify-content:center"><i class="fa-solid fa-dice"></i> 随机提示词</button>
        <button class="ib" id="themeToggle" title="切换主题"><i class="fa-solid fa-moon" id="themeIcon"></i></button>
        <button class="ib" id="logoutBtn" title="退出登录"><i class="fa-solid fa-right-from-bracket"></i></button>
      </div>
    </div>
    <div id="i2iFooter" style="display:none">
      <button class="btn bp bfw" id="i2iGenBtn" style="height:42px;font-size:13.5px;border-radius:var(--r);margin-bottom:10px">
        <i class="fa-solid fa-wand-magic-sparkles"></i> 开始图生图
      </button>
      <div style="display:flex;gap:6px;align-items:center">
        <div style="flex:1;font-size:11px;color:var(--muted)">基于参考图生成</div>
        <button class="ib" id="themeToggle2" title="切换主题"><i class="fa-solid fa-moon" id="themeIcon2"></i></button>
        <button class="ib" id="logoutBtn2" title="退出登录"><i class="fa-solid fa-right-from-bracket"></i></button>
      </div>
    </div>
  </div>

</aside>

<!-- MAIN -->
<div id="main">
  <div class="topbar">
    <div class="topbar-title" id="topbarTitle">
      <i class="fa-solid fa-wand-magic-sparkles" style="color:var(--accent);margin-right:8px;font-size:13px"></i>文生图
    </div>
    <div class="sdot"></div>
    <span class="slbl">Workers AI 在线</span>
  </div>

  <div class="pcont">
    <div class="cols">

      <!-- RESULT PANEL -->
      <div style="display:flex;flex-direction:column;gap:16px">

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

  <!-- 图生图结果区 -->
  <div id="i2iView" style="display:none">
    <div class="pcont">
      <div class="card">
        <div class="ch">
          <div class="ch-ic"><i class="fa-solid fa-image"></i></div>
          <span class="ct">图生图结果</span>
          <div style="display:flex;gap:6px;margin-left:auto">
            <button class="btn bg bsm hidden" id="i2iDlBtn"><i class="fa-solid fa-download"></i> 下载</button>
          </div>
        </div>
        <div class="cb">
          <div id="i2iImgArea" style="aspect-ratio:1;background:var(--surface2);border-radius:var(--r);border:1.5px dashed var(--border2);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
            <div id="i2iImgPH" style="text-align:center;color:var(--muted)">
              <i class="fa-regular fa-image" style="font-size:32px;margin-bottom:10px;display:block;opacity:.25"></i>
              <p style="font-size:13px;font-weight:500">上传参考图后点击「开始图生图」</p>
            </div>
            <img id="i2iResultImg" alt="图生图结果" style="width:100%;height:100%;object-fit:contain;border-radius:6px;display:none">
            <div class="ldov" id="i2iLdov">
              <div class="spn"></div>
              <p>图生图生成中…</p>
              <p class="sub">这可能需要几十秒</p>
              <div class="timer" id="i2iTimer">0s</div>
            </div>
          </div>
          <div class="img-meta hidden" id="i2iMeta">
            <span class="mb"><i class="fa-regular fa-clock"></i><span id="i2iGenTime">-</span></span>
            <span class="mb"><i class="fa-solid fa-microchip"></i><span id="i2iUsedMdl">-</span></span>
          </div>
        </div>
      </div>
    </div>
  </div><!-- end i2iView -->

</div><!-- end main -->

<div id="toast"></div>

<script>
(function(){
'use strict';
var models=[],curParams=null,enhOn=true,genTimer=null;
var i2iImageB64=null,i2iTimer=null;
var activeTab='t2i'; // 't2i' | 'i2i'

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
document.getElementById('logoutBtn2').addEventListener('click',function(){
  document.getElementById('logoutBtn').click();
});
document.getElementById('themeToggle2').addEventListener('click',function(){
  document.getElementById('themeToggle').click();
  var d=html.classList.contains('dark');
  document.getElementById('themeIcon2').className=d?'fa-solid fa-sun':'fa-solid fa-moon';
});

// ── Tab Switching ──────────────────────────────────────────────────────────
var t2iNavBtn=document.querySelector('.ni.active');
var img2imgNavBtn=document.getElementById('img2imgNavBtn');
function switchTab(tab){
  activeTab=tab;
  var ist2i=tab==='t2i';
  document.getElementById('t2iSettings').style.display=ist2i?'':'none';
  document.getElementById('i2iSettings').style.display=ist2i?'none':'';
  document.getElementById('t2iFooter').style.display=ist2i?'':'none';
  document.getElementById('i2iFooter').style.display=ist2i?'none':'';
  // main views
  document.querySelector('#main .pcont').style.display=ist2i?'':'none';
  document.getElementById('i2iView').style.display=ist2i?'none':'';
  // topbar
  var tb=document.getElementById('topbarTitle');
  tb.innerHTML=ist2i
    ?'<i class="fa-solid fa-wand-magic-sparkles" style="color:var(--accent);margin-right:8px;font-size:13px"></i>文生图'
    :'<i class="fa-solid fa-image" style="color:var(--accent);margin-right:8px;font-size:13px"></i>图生图';
  // nav active state
  t2iNavBtn.classList.toggle('active',ist2i);
  img2imgNavBtn.classList.toggle('active',!ist2i);
}
t2iNavBtn.addEventListener('click',function(){switchTab('t2i');});
img2imgNavBtn.addEventListener('click',function(){switchTab('i2i');});

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
// 默认开启增强
enhToggle.classList.add('on');
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
    // 文生图下拉（排除专用图生图模型）
    var t2iModels=models.filter(function(m){return !m.i2iOnly;});
    var groups={};
    t2iModels.forEach(function(m){(groups[m.provider]||(groups[m.provider]=[])).push(m);});
    Object.keys(groups).forEach(function(prov){
      var og=document.createElement('optgroup');
      var cfg=PV_CFG[prov]||{label:prov};
      og.label=cfg.label||prov;
      groups[prov].forEach(function(m){
        var o=document.createElement('option');o.value=m.id;
        o.textContent=m.name+' — '+m.description;og.appendChild(o);
      });
      sel.appendChild(og);
    });
    // 默认选 cf-flux-schnell
    var defM=t2iModels.find(function(m){return m.id==='cf-flux-schnell';});
    if(defM)sel.value=defM.id;
    updatePvBadge(sel.value);
    sel.addEventListener('change',function(){updatePvBadge(sel.value);});
    // 图生图模型：仅支持传图的 CF 模型（排除 FLUX 系列，它们不支持图生图）
    var i2iSel=document.getElementById('i2iModel');i2iSel.innerHTML='';
    var i2iModels=models.filter(function(m){
      return m.type==='sdxl'||m.type==='img2img';
    });
    // 按 provider 分组
    var i2iGroups={};
    i2iModels.forEach(function(m){(i2iGroups[m.provider]||(i2iGroups[m.provider]=[])).push(m);});
    Object.keys(i2iGroups).forEach(function(prov){
      var og=document.createElement('optgroup');
      var cfg=PV_CFG[prov]||{label:prov};
      og.label=cfg.label||prov;
      i2iGroups[prov].forEach(function(m){
        var o=document.createElement('option');o.value=m.id;
        o.textContent=m.name+' — '+m.description;og.appendChild(o);
      });
      i2iSel.appendChild(og);
    });
    // 默认选专用图生图模型
    var defI2I=i2iModels.find(function(m){return m.id==='cf-sd15-img2img';});
    if(defI2I)i2iSel.value=defI2I.id;
  }catch(e){toast('加载模型失败','err');}
}
loadModels();

document.getElementById('randomBtn').addEventListener('click',async function(){
  var btn=this;
  btn.disabled=true;
  var orig=btn.innerHTML;
  btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> 生成中…';
  try{
    var r=await fetch('/api/prompts');
    var data=await r.json();
    if(data.prompt){
      document.getElementById('prompt').value=data.prompt;
    }else{
      toast('生成失败，请重试','err');
    }
  }catch(e){
    toast('网络错误','err');
  }finally{
    btn.disabled=false;
    btn.innerHTML=orig;
  }
});

// ── Img2Img ────────────────────────────────────────────────────────────────
// 滑块
document.getElementById('i2iStrength').addEventListener('input',function(){
  document.getElementById('strV').textContent=parseFloat(this.value).toFixed(2);
});
document.getElementById('i2iSteps').addEventListener('input',function(){
  document.getElementById('i2iStV').textContent=this.value;
});
document.getElementById('i2iGuidance').addEventListener('input',function(){
  document.getElementById('i2iGuV').textContent=parseFloat(this.value).toFixed(2);
});

// 上传图片
function setI2iImage(file){
  if(!file||!file.type.startsWith('image/'))return;
  var reader=new FileReader();
  reader.onload=function(e){
    i2iImageB64=e.target.result; // data:image/...;base64,...
    document.getElementById('i2iPH').style.display='none';
    var prev=document.getElementById('i2iPreview');
    prev.src=i2iImageB64;prev.style.display='block';
    var clr=document.getElementById('i2iClear');clr.style.display='flex';
    // 根据图片宽高设置 aspect-ratio
    var img=new Image();
    img.onload=function(){
      document.getElementById('i2iImgArea').style.aspectRatio=(img.width/img.height).toFixed(4);
    };
    img.src=i2iImageB64;
  };
  reader.readAsDataURL(file);
}
document.getElementById('i2iFile').addEventListener('change',function(){
  if(this.files[0])setI2iImage(this.files[0]);
});
document.getElementById('i2iClear').addEventListener('click',function(e){
  e.stopPropagation();
  i2iImageB64=null;
  document.getElementById('i2iPreview').style.display='none';
  document.getElementById('i2iPH').style.display='';
  this.style.display='none';
  document.getElementById('i2iFile').value='';
  document.getElementById('i2iImgArea').style.aspectRatio='1';
});
// 拖拽
var dz=document.getElementById('i2iDropZone');
dz.addEventListener('dragover',function(e){e.preventDefault();this.style.borderColor='var(--accent)';});
dz.addEventListener('dragleave',function(){this.style.borderColor='';});
dz.addEventListener('drop',function(e){
  e.preventDefault();this.style.borderColor='';
  var f=e.dataTransfer.files[0];if(f)setI2iImage(f);
});

// 生成
var i2iTimerInterval=null;
document.getElementById('i2iGenBtn').addEventListener('click',async function(){
  if(!i2iImageB64){toast('请先上传参考图片','warn');return;}
  var modelId=document.getElementById('i2iModel').value;
  if(!modelId){toast('没有可用的 SD 模型','err');return;}
  var prompt=document.getElementById('i2iPrompt').value||'';
  var neg=document.getElementById('i2iNeg').value||'';
  var strength=parseFloat(document.getElementById('i2iStrength').value)||0.75;
  var steps=parseInt(document.getElementById('i2iSteps').value)||20;
  var guidance=parseFloat(document.getElementById('i2iGuidance').value)||7.5;

  var ldov=document.getElementById('i2iLdov');
  var resultImg=document.getElementById('i2iResultImg');
  var ph=document.getElementById('i2iImgPH');
  var timerEl=document.getElementById('i2iTimer');
  var btn=this;

  btn.disabled=true;
  resultImg.style.display='none';ph.style.display='none';
  ldov.classList.add('show');
  document.getElementById('i2iMeta').classList.add('hidden');

  var t0=performance.now();
  clearInterval(i2iTimerInterval);
  i2iTimerInterval=setInterval(function(){timerEl.textContent=((performance.now()-t0)/1000).toFixed(1)+'s';},200);

  try{
    var res=await fetch('/',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'image/*'},
      body:JSON.stringify({
        password:sessionStorage.getItem('apw')||'',
        prompt:prompt,
        negative_prompt:neg,
        model:modelId,
        strength:strength,
        num_steps:steps,
        guidance:guidance,
        seed:Math.floor(Math.random()*4294967295),
        image_b64:i2iImageB64.split(',')[1], // 去掉 data:...;base64, 前缀
      }),
    });
    clearInterval(i2iTimerInterval);
    if(!res.ok){
      var err=await res.json().catch(function(){return {error:'生成失败'};});
      toast(err.error||'图生图失败','err');
    } else {
      var blob=await res.blob();
      var b64=await blobToB64(blob);
      resultImg.src=b64;resultImg.style.display='block';
      var elapsed=((performance.now()-t0)/1000).toFixed(2);
      var mdl=models.find(function(m){return m.id===modelId;});
      document.getElementById('i2iGenTime').textContent=elapsed+'s';
      document.getElementById('i2iUsedMdl').textContent=mdl?mdl.name:modelId;
      document.getElementById('i2iMeta').classList.remove('hidden');
      // 下载
      var dlBtn=document.getElementById('i2iDlBtn');
      dlBtn.classList.remove('hidden');
      dlBtn.onclick=function(){
        var a=document.createElement('a');a.href=b64;
        a.download='i2i-'+Date.now()+'.png';a.click();
      };
      toast('图生图完成','ok');
    }
  }catch(e){
    clearInterval(i2iTimerInterval);
    toast('请求失败：'+e.message,'err');
  }finally{
    clearInterval(i2iTimerInterval);
    ldov.classList.remove('show');
    btn.disabled=false;
  }
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

// 自动降级模型链：主模型失败后按顺序尝试
var FALLBACK_CHAIN=['pol-flux','pol-flux-realism','pol-turbo','pol-any-dark','pol-flux-anime','pol-flux-3d','pol-konyconi','pol-flux-cablyai'];

// 发起单次请求（带超时），成功返回 {res, blob, b64}，失败抛出错误
async function tryFetch(params, timeoutMs){
  timeoutMs = timeoutMs || 50000;
  var controller = new AbortController();
  var timer = setTimeout(function(){ controller.abort(); }, timeoutMs);
  try{
    var res=await fetch('/',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'image/*'},
      body:JSON.stringify(params),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if(!res.ok){
      var ct=res.headers.get('content-type')||'';
      var errData=ct.includes('json')?await res.json():{error:'生成失败'};
      if(errData.loading)throw Object.assign(new Error(errData.error||'模型加载中'),{loading:true});
      throw new Error(errData.error||'生成失败 ('+res.status+')');
    }
    var blob=await res.blob();
    var b64=await blobToB64(blob);
    return {res:res,blob:blob,b64:b64};
  }catch(e){
    clearTimeout(timer);
    if(e.name==='AbortError') throw new Error('请求超时，切换备用模型');
    throw e;
  }
}

async function generate(reuse){
  var overlay=document.getElementById('ldov');
  var ph=document.getElementById('imgPH');
  var area=document.getElementById('imgArea');
  var enhTagEl=document.getElementById('enhTag');
  var ldText=overlay.querySelector('p');
  var ldSub=overlay.querySelector('.sub');

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
  if(ldText)ldText.textContent='生成中，请稍候…';
  if(ldSub)ldSub.textContent='这可能需要几秒到几十秒';

  var t0=performance.now();
  var timerEl=document.getElementById('ldTimer');
  clearInterval(genTimer);
  genTimer=setInterval(function(){timerEl.textContent=((performance.now()-t0)/1000).toFixed(1)+'s';},200);

  var params=reuse&&curParams?Object.assign({},curParams,{password:sessionStorage.getItem('apw')||''}):{
    password:sessionStorage.getItem('apw')||'',
    prompt:document.getElementById('prompt').value||'a beautiful landscape',
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

  // 构建完整尝试队列：主模型 + 降级链（排除重复）
  var primaryModel=params.model;
  var queue=[primaryModel].concat(
    FALLBACK_CHAIN.filter(function(id){return id!==primaryModel;})
  );

  var result=null;
  var usedFallback=false;
  var lastErr=null;

  for(var qi=0;qi<queue.length;qi++){
    var tryModel=queue[qi];
    var tryParams=Object.assign({},params,{model:tryModel});

    if(qi>0){
      // 降级尝试，更新 overlay 提示
      var fallbackName=getMdlName(tryModel)||tryModel;
      if(ldText)ldText.textContent='正在切换备用模型…';
      if(ldSub)ldSub.textContent='备用：'+fallbackName;
      toast('主模型失败，切换备用：'+fallbackName,'warn');
      usedFallback=true;
    }

    try{
      result=await tryFetch(tryParams);
      // 成功，把实际用的模型写回 params
      params=tryParams;
      if(!reuse)curParams=Object.assign({},params);
      break;
    }catch(err){
      lastErr=err;
      clearInterval(genTimer);
      // 如果是模型冷启动，不继续降级，直接提示
      if(err.loading){
        overlay.classList.remove('show');ph.style.display='';
        document.getElementById('genBtn').disabled=false;
        toast('模型加载中，请 30 秒后重试 ⏳','warn');
        return;
      }
      // 还有备用模型则重启计时器继续
      if(qi<queue.length-1){
        t0=performance.now();
        genTimer=setInterval(function(){timerEl.textContent=((performance.now()-t0)/1000).toFixed(1)+'s';},200);
      }
    }
  }

  clearInterval(genTimer);

  if(!result){
    overlay.classList.remove('show');ph.style.display='';
    document.getElementById('genBtn').disabled=false;
    toast((lastErr&&lastErr.message)||'所有模型均生成失败','err');
    return;
  }

  var elapsed=((performance.now()-t0)/1000).toFixed(2);
  var res=result.res, b64=result.b64;

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

    // 显示降级徽标
    if(usedFallback){
      var rb=document.getElementById('retryBadge');
      rb.innerHTML='<i class="fa-solid fa-rotate-right"></i> 已切换备用：'+getMdlName(params.model);
      rb.classList.remove('hidden');
    }

    renderParams(params,null,null);
    ['cpBtn','dlBtn','reuseBtn'].forEach(function(id){document.getElementById(id).classList.remove('hidden');});
    document.getElementById('genBtn').disabled=false;
    // 恢复 overlay 文案
    if(ldText)ldText.textContent='生成中，请稍候…';
    if(ldSub)ldSub.textContent='这可能需要几秒到几十秒';

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
      toast(usedFallback?'备用模型生成成功 🎨':'生成成功 🎨','ok');
    }
    histAdd({img:b64,prompt:params.prompt,params:params,ts:Date.now()}).then(renderHistory).catch(function(){});
  };
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
  { id:'cf-flux-dev',      name:'FLUX.1-dev FP8',      description:'旗舰质量 · 细节极佳',      provider:'cloudflare', key:'@cf/black-forest-labs/flux-1-dev-fp8',               type:'flux-dev' },
  { id:'cf-flux-schnell',  name:'FLUX.1 Schnell',       description:'极速生成 · 质量均衡',      provider:'cloudflare', key:'@cf/black-forest-labs/flux-1-schnell',               type:'flux-schnell' },
  { id:'cf-sdxl',          name:'Stable Diffusion XL',  description:'SDXL 高质量通用',          provider:'cloudflare', key:'@cf/stabilityai/stable-diffusion-xl-base-1.0',      type:'sdxl' },
  { id:'cf-sdxl-lightning',name:'SDXL Lightning',       description:'极速 SDXL 版本',            provider:'cloudflare', key:'@cf/bytedance/stable-diffusion-xl-lightning',        type:'sdxl' },
  { id:'cf-dreamshaper',   name:'DreamShaper 8 LCM',    description:'增强真实感微调模型',        provider:'cloudflare', key:'@cf/lykon/dreamshaper-8-lcm',                       type:'sdxl' },
  { id:'cf-sd15-img2img',  name:'SD 1.5 图生图',         description:'专用图生图模型 · 最稳定',  provider:'cloudflare', key:'@cf/runwayml/stable-diffusion-v1-5-img2img',         type:'img2img', i2iOnly:true },
];

const POLLINATIONS_MODELS = [
  { id:'pol-flux',          name:'FLUX',              description:'免费 · 高质量旗舰',     provider:'pollinations', key:'flux' },
  { id:'pol-flux-realism',  name:'FLUX Realism',      description:'免费 · 超写实人像',     provider:'pollinations', key:'flux-realism' },
  { id:'pol-flux-anime',    name:'FLUX Anime',         description:'免费 · 动漫插画风',     provider:'pollinations', key:'flux-anime' },
  { id:'pol-flux-3d',       name:'FLUX 3D',            description:'免费 · 3D渲染质感',     provider:'pollinations', key:'flux-3d' },
  { id:'pol-turbo',         name:'SDXL Turbo',         description:'免费 · 极速生成',       provider:'pollinations', key:'turbo' },
  { id:'pol-any-dark',      name:'Any Dark',           description:'免费 · 暗黑艺术风格',   provider:'pollinations', key:'any-dark' },
  { id:'pol-konyconi',      name:'Kony Coni',          description:'免费 · 二次元插画',     provider:'pollinations', key:'konyconi' },
  { id:'pol-flux-cablyai',  name:'FLUX CablyAI',       description:'免费 · 写实增强版',     provider:'pollinations', key:'flux-cablyai' },
];

const HF_MODELS = [
  { id:'hf-flux-dev',     name:'FLUX.1-dev',     description:'需HF_TOKEN · 开源旗舰',   provider:'huggingface', key:'black-forest-labs/FLUX.1-dev' },
  { id:'hf-flux-schnell', name:'FLUX.1-schnell', description:'需HF_TOKEN · 极速FLUX',   provider:'huggingface', key:'black-forest-labs/FLUX.1-schnell' },
  { id:'hf-sdxl',         name:'SDXL',           description:'需HF_TOKEN · Stability AI',provider:'huggingface', key:'stabilityai/stable-diffusion-xl-base-1.0' },
];

const ALL_MODELS = [...CF_MODELS, ...POLLINATIONS_MODELS, ...HF_MODELS];

// 随机提示词由 AI 实时生成，见 /api/prompts 路由

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
        try {
          const categories = [
            '赛博朋克城市、霓虹灯、雨夜',
            '奇幻生物、神话怪兽',
            '人物肖像、独特风格',
            '抽象艺术、几何、色彩',
            '美食摄影、诱人料理',
            '水下场景、海洋生物',
            '太空探索、科幻星球',
            '温馨室内、暖光氛围',
            '壮阔山河、自然风光',
            '街头摄影、城市生活',
            '蒸汽朋克机械、复古工业',
            '恐怖氛围、黑暗压抑',
            '可爱动物、治愈系',
            '废墟遗迹、考古探险',
            '未来机器人、科技感',
            '植物插画、花卉写实',
            '动作场面、力量爆发',
            '极简构图、留白设计',
            '超现实主义、荒诞奇异',
            '东方水墨、写意风格',
            '末日废土、文明崩塌',
            '热带雨林、浓郁色彩',
            '黑色电影、阴影对比',
            '二次元chibi、Q版人物',
            '超写实油画、质感细腻',
            '大雪暴风、极寒荒野',
            '沙漠戈壁、烈日炎炎',
            '老上海风情、民国旗袍',
            '像素艺术、复古游戏',
            '显微镜下、微观世界',
          ];
          const pick = categories[Math.floor(Math.random() * categories.length)];
          const resp = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
              { role: 'system', content: `你是一个图像生成提示词生成器。
根据给定主题，输出一条5-12个词的提示词，用于AI图像生成。
要求：
- 必须用中文输出，可以夹杂少量英文专业词汇（如风格词、摄影术语）
- 要具体生动，避免"美丽""惊艳"等空泛形容词
- 可以包含风格、光线、构图、情绪等要素
- 只输出提示词本身，不加引号、不加解释
- 禁止出现：星空、古堡、樱花、唯美、梦幻等滥用词` },
              { role: 'user', content: `主题：${pick}` },
            ],
            max_tokens: 80,
          });
          const text = (resp?.response || '').trim().replace(/^["']|["']$/g, '');
          return new Response(JSON.stringify({ prompt: text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch(e) {
          return new Response(JSON.stringify({ prompt: '' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
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
      num_steps: data.num_steps || 20, strength: data.strength || 0.1,
      guidance: data.guidance || 7.5,
      seed: data.seed || Math.floor(Math.random() * 1048576),
    };
    // 图生图：传入参考图
    if (data.image_b64) {
      const binary = atob(data.image_b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      inputs.image = [...bytes];
      inputs.strength = data.strength || 0.75;
    }
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
