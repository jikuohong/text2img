# AI 文生图 Text2Img Worker

基于 Cloudflare Workers 的多模型 AI 文生图服务，支持提示词增强、自动上传图床、联动图库，单文件部署。

---

## 部署

### 1. 创建 Worker

在 Cloudflare Dashboard 中创建新 Worker，命名为 `text2img`（或任意名称）。

### 2. 绑定配置

进入 Worker → **绑定** → 添加以下绑定：

| 类型 | 变量名 | 说明 |
|------|--------|------|
| Workers AI | `AI` | 用于提示词增强（Llama）和图片生成（CF 模型） |

### 3. 环境变量

进入 Worker → **设置** → **变量和机密**：

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `PASSWORD` | `yourpassword` | 访问密码，多个密码用英文逗号分隔，留空则不验证 |
| `HF_TOKEN` | `hf_xxx...` | HuggingFace API Token，不填则隐藏 HF 模型 |
| `ENHANCE` | `false` | 设为 `false` 全局禁用提示词增强，默认开启 |
| `IMAGE_HOST` | `https://image.kont.us.ci` | 图床地址，末尾不要加 `/` |
| `GALLERY_URL` | `https://gallery.kont.us.ci` | Gallery Worker 地址，末尾不要加 `/` |

> `IMAGE_HOST` 和 `GALLERY_URL` 二者同时配置时，图片生成后会先发给 Gallery Worker 做 AI 分析并上传图床；只配置 `IMAGE_HOST` 时仅上传图床不入图库。

### 4. 部署代码

将 `worker-single.js` 的全部内容粘贴到 Worker 编辑器中，点击 **Save and Deploy**。

---

## 支持的模型

### Cloudflare Workers AI（需 AI 绑定）

| 模型 ID | 名称 | 说明 |
|---------|------|------|
| `cf-flux-dev` | FLUX.1-dev FP8 | 旗舰质量，细节极佳 |
| `cf-flux-schnell` | FLUX.1 Schnell | 极速生成，质量均衡 |
| `cf-sdxl` | Stable Diffusion XL | SDXL 高质量通用 |
| `cf-sdxl-lightning` | SDXL Lightning | 极速 SDXL 版本 |
| `cf-dreamshaper` | DreamShaper 8 LCM | 增强真实感微调模型 |

### Pollinations AI（免费，无需 Key）

| 模型 ID | 名称 | 说明 |
|---------|------|------|
| `pol-flux` | FLUX | 高质量 |
| `pol-flux-realism` | FLUX Realism | 超写实 |
| `pol-turbo` | Turbo | 极速 |
| `pol-flux-anime` | FLUX Anime | 动漫风格 |
| `pol-flux-3d` | FLUX 3D | 3D 渲染风格 |

### HuggingFace Inference（需配置 `HF_TOKEN`）

| 模型 ID | 名称 | 说明 |
|---------|------|------|
| `hf-flux-dev` | FLUX.1-dev | 开源旗舰 |
| `hf-flux-schnell` | FLUX.1-schnell | 极速 FLUX |
| `hf-sdxl` | SDXL | Stability AI 官方 |

---

## 功能说明

### 提示词增强

使用 `@cf/meta/llama-3.1-8b-instruct` 对输入提示词进行扩写和优化：

- 自动检测中文并翻译为英文
- 补充光照、构图、风格、氛围等细节
- 生成后页面会同时显示原始和增强后的提示词
- 可在页面右上角开关随时切换，也可通过 `ENHANCE=false` 环境变量全局禁用

### 快速尺寸模板

页面提供 8 种常用尺寸一键切换：

| 模板 | 尺寸 |
|------|------|
| 正方形 | 1024 × 1024 |
| 横屏 16:9 | 1920 × 1080 |
| 竖屏 9:16 | 1080 × 1920 |
| 封面图 | 1200 × 630 |
| Instagram | 1080 × 1080 |
| Twitter 封面 | 1500 × 500 |
| 壁纸 2K | 2560 × 1440 |
| 极速小图 | 512 × 512 |

### 高级选项

折叠面板中可手动调整：
- 宽度 / 高度滑块
- 推理步数（Steps）
- 引导系数（Guidance Scale）
- 随机种子（Seed）

### 自动上传图床

配置 `IMAGE_HOST` 后，每次生成成功图片会自动上传到图床，页面下方出现图床直链栏，支持一键复制和跳转。

### 自动入图库

同时配置 `IMAGE_HOST` 和 `GALLERY_URL` 后，完整流程：

```
生成图片 → 发给 Gallery Worker → AI 视觉分析打标签 → 上传图床 → 存入 KV 图库 → 返回直链给前端
```

### 历史记录

- 每次生成自动保存到本地（IndexedDB）
- 侧边栏「历史记录」可查看所有记录
- 点击历史条目可一键复用提示词和参数重新生成
- 支持单条删除或清空全部

### 超时重试

每次请求超时限制 55 秒，失败后自动重试 1 次，重试间隔 1 秒。

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/` | 返回前端页面 |
| `GET` | `/api/models` | 返回当前可用模型列表 |
| `GET` | `/api/prompts` | 返回随机提示词列表 |
| `POST` | `/` | 生成图片 |

### POST `/` 请求体（JSON）

| 字段 | 类型 | 说明 |
|------|------|------|
| `password` | string | 访问密码（若已配置） |
| `prompt` | string | 提示词（必填） |
| `model` | string | 模型 ID（必填） |
| `enhance` | boolean | 是否开启提示词增强 |
| `width` | number | 图片宽度，默认 1024 |
| `height` | number | 图片高度，默认 1024 |
| `num_steps` | number | 推理步数 |
| `guidance` | number | 引导系数 |
| `seed` | number | 随机种子 |

### POST `/` 响应

- Content-Type：`image/png` 或 `image/jpeg`
- 响应头 `x-image-url`：图床直链（配置图床后返回）
- 响应头 `x-enhanced`：增强后的提示词文本

---

## 快捷链接

页面侧边栏「工具」区提供跳转：
- **AI 图库** → `https://gallery.kont.us.ci`
- **图床** → `https://image.kont.us.ci`
