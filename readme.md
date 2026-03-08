# 文生图 Worker · AI Image Generation

基于 Cloudflare Workers 的 AI 文生图工具，聚合 Cloudflare AI、Pollinations、HuggingFace 三大服务商共 17 个模型，支持文生图、图生图、提示词增强，并可自动同步到图库。

---

## 功能一览

- **多服务商聚合**：Cloudflare AI / Pollinations / HuggingFace 一键切换
- **自动 Fallback**：主模型失败时自动切换备用模型，确保出图成功率
- **提示词增强**：AI 自动优化中英文提示词，提升图片质量
- **图生图（图转图）**：上传参考图，按描述或风格生成新图（这个图生图效果非常的差。出来的人脸都变异性了）
- **图库联动**：生成完自动推送到 Gallery Worker，无缝存档
- **图床直传**：图片直接上传至图床，生成持久稳定的直链
- **深色模式**：跟随系统自动切换，也可手动切换
- **移动端适配**：响应式布局，手机可用

---

## 部署步骤

### 1. 部署 Worker

在 Cloudflare 控制台进入 **Workers & Pages → Create → Worker**，将 `text2img-worker.js` 的内容完整粘贴，保存并部署。

### 2. 配置环境变量

在 Worker 的 **Settings → Variables → Environment Variables** 中按需添加：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `PASSWORD` | 否 | 访问密码，多个密码用英文逗号分隔，留空则无需密码 |
| `IMAGE_HOST` | 否 | 图床地址，如 `https://image.kont.us.ci`，设置后图片自动上传图床 |
| `GALLERY_URL` | 否 | 图库地址，如 `https://gallery.kont.us.ci`，设置后图片自动入库 |
| `HF_TOKEN` | 否 | HuggingFace API Token，不填则 HF 模型不显示 |
| `ENHANCE` | 否 | 设为 `false` 可全局关闭提示词增强功能 |

> `IMAGE_HOST` 和 `GALLERY_URL` 同时设置时，图片由 Gallery Worker 负责转存到图床；只设置 `IMAGE_HOST` 时，由本 Worker 直接上传。

### 3. 替换侧边栏链接（可选）

侧边栏底部有图库和图床的快捷入口，在代码中搜索并替换以下占位符：

| 占位符 | 替换为 |
|--------|--------|
| `YOUR_GALLERY_URL` | 你的图库地址，如 `https://gallery.kont.us.ci` |
| `YOUR_IMAGE_HOST_URL` | 你的图床地址，如 `https://image.kont.us.ci` |

---

## 模型列表

### Cloudflare AI（6 个）

| 模型 ID | 名称 | 特点 |
|---------|------|------|
| `cf-flux-dev` | FLUX.1-dev FP8 | 旗舰质量，细节极佳 |
| `cf-flux-schnell` | FLUX.1 Schnell | 极速生成，质量均衡 |
| `cf-sdxl` | Stable Diffusion XL | SDXL 高质量通用 |
| `cf-sdxl-lightning` | SDXL Lightning | 极速 SDXL 版本 |
| `cf-dreamshaper` | DreamShaper 8 LCM | 增强真实感微调模型 |
| `cf-sd15-img2img` | SD 1.5 图生图 | **仅图生图**，最稳定 |

### Pollinations（8 个，免费无需 Token）

| 模型 ID | 名称 | 特点 |
|---------|------|------|
| `pol-flux` | FLUX | 高质量旗舰 |
| `pol-flux-realism` | FLUX Realism | 超写实人像 |
| `pol-flux-anime` | FLUX Anime | 动漫插画风 |
| `pol-flux-3d` | FLUX 3D | 3D 渲染质感 |
| `pol-turbo` | SDXL Turbo | 极速生成 |
| `pol-any-dark` | Any Dark | 暗黑艺术风格 |
| `pol-konyconi` | Kony Coni | 二次元插画 |
| `pol-flux-cablyai` | FLUX CablyAI | 写实增强版 |

### HuggingFace（3 个，需 HF_TOKEN）

| 模型 ID | 名称 | 特点 |
|---------|------|------|
| `hf-flux-dev` | FLUX.1-dev | 开源旗舰 |
| `hf-flux-schnell` | FLUX.1-schnell | 极速 FLUX |
| `hf-sdxl` | SDXL | Stability AI 原版 |

---

## 自动 Fallback 机制

当所选模型生成失败时，Worker 会按以下顺序自动尝试备用模型，直到出图成功：

```
pol-flux → pol-flux-realism → pol-turbo → pol-any-dark
    → pol-flux-anime → pol-flux-3d → pol-konyconi → pol-flux-cablyai
```

Fallback 期间页面显示「正在使用备用模型」提示，最终显示实际使用的模型名称。

---

## 图生图使用说明

点击侧边栏「图生图」标签切换模式：

1. 拖拽或点击上传参考图（支持 JPG / PNG / WebP）
2. 填写提示词，描述想要的风格或内容变化（留空则保持原图风格）
3. 调整参数：
   - **变换强度**：0.1（几乎不变）→ 1.0（完全重绘），建议 0.6–0.8
   - **迭代步数**：步数越高质量越好，但耗时更长，建议 20
   - **引导系数**：越高越遵从提示词，建议 7–10
4. 可用模型：Cloudflare SDXL 系列 + SD 1.5 图生图（推荐）

---

## 提示词增强

开启后，输入中文或简短英文提示词时，AI 会自动扩写为更详细的英文提示词再送入模型，通常能明显提升画面质量。

- 在侧边栏「提示词增强」开关控制
- 环境变量 `ENHANCE=false` 可全局强制关闭
- 增强后的完整提示词会在生成结果下方展示

---

## 与图库 / 图床联动

设置 `GALLERY_URL` 后，每次文生图完成时：

```
生成图片（base64）
    ↓
POST {GALLERY_URL}/gallery/ingest（含图片文件 + 提示词 + 参数）
    ↓
Gallery Worker 上传图床 + AI 打标签 + 写入 KV
```

之后可在图库页面直接浏览、搜索所有生成过的图片。

---

## API 说明

所有接口通过 POST 请求调用，均需在请求头中携带 `X-Password: 你的密码`（未设置 `PASSWORD` 时无需鉴权）。

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/` | 返回主界面 |
| `POST` | `/generate` | 文生图，参数见下方 |
| `POST` | `/img2img` | 图生图，参数见下方 |
| `GET` | `/models` | 返回当前可用的模型列表 |

**`/generate` 请求体（JSON）：**

```json
{
  "prompt": "a futuristic city at sunset",
  "negativePrompt": "",
  "model": "pol-flux",
  "width": 1024,
  "height": 1024,
  "steps": 20,
  "guidance": 7.5,
  "seed": -1,
  "enhance": true
}
```

**`/img2img` 请求体（multipart/form-data）：**

| 字段 | 说明 |
|------|------|
| `image` | 参考图文件 |
| `prompt` | 提示词 |
| `negativePrompt` | 负向提示词 |
| `model` | 模型 ID |
| `strength` | 变换强度 0.1–1.0 |
| `steps` | 迭代步数 |
| `guidance` | 引导系数 |

---

## 相关项目

- [Gallery Worker](https://gallery.kont.us.ci) — 配套 AI 图库，自动存档所有生成图片
- [Telegraph Image 图床](https://image.kont.us.ci) — 图片文件实际存储
