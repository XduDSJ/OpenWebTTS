# /api/piper_voices 阻塞事件循环导致应用卡死

**日期**：2026-07-26
**关联提交**：f706444（已推送）
**发现方式**：用户测试 i18n 回归修复时，访问 /config 页报告 "error loading voices" + 刷新后页面卡死

## 现象

1. /config 页 Piper 模型下载区显示 "error loading voices"
2. 服务器日志：`GET /api/piper_voices HTTP/1.1` 500 Internal Server Error
3. 刷新 /config 页后页面长时间卡死，过好一会儿才恢复

## 根因

`functions/routes.py:300-307` 的 `get_piper_voices_from_hf` 是 **async 函数**，但内部**同步调用** `requests.get()` 且**无 timeout**：

```python
@router.get("/api/piper_voices")
async def get_piper_voices_from_hf():
    try:
        response = requests.get("https://huggingface.co/rhasspy/piper-voices/raw/main/voices.json")
        response.raise_for_status()
        return JSONResponse(content=response.json())
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch voices from Hugging Face: {e}")
```

两个问题叠加：

1. **async 函数中同步阻塞**：`requests.get()` 是同步阻塞调用，在 async 函数中直接调用会阻塞 FastAPI 的整个事件循环。阻塞期间，所有其他请求（包括页面加载）都排队等待，导致整个应用卡死。

2. **无 timeout**：Docker 容器网络不通或 huggingface.co 不可达时，`requests.get()` 无限挂起，事件循环被永久阻塞，应用彻底无响应。

## 修复

用 `asyncio.to_thread` 将同步 `requests.get` 放到线程池执行，并加 `timeout=10`：

```python
@router.get("/api/piper_voices")
async def get_piper_voices_from_hf():
    try:
        response = await asyncio.to_thread(
            requests.get,
            "https://huggingface.co/rhasspy/piper-voices/raw/main/voices.json",
            timeout=10,
        )
        response.raise_for_status()
        return JSONResponse(content=response.json())
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch voices from Hugging Face: {e}")
```

- `asyncio.to_thread`：Python 3.9+ 内置，将同步函数放到默认线程池执行，返回可 await 的协程，不阻塞事件循环
- `timeout=10`：10 秒超时，网络不通时快速失败返回 500，不再无限挂起

## 验证

- `python -m py_compile functions/routes.py` 语法通过
- CI/CD 构建成功（commit f706444）
- 待用户拉取新镜像后验证：/config 页 10 秒内显示列表或报错，不再卡死

## 同类风险

`functions/routes.py` 中还有 4 处 `requests.get()` 调用（line 315、322、337、602），均在 async 函数中同步调用。但这些是文件下载/网页抓取接口，触发频率低，且本次修复范围聚焦 piper_voices 卡死问题。建议后续统一改为 `asyncio.to_thread` + timeout 模式。

## 改动文件

- `functions/routes.py` — 新增 `import asyncio`，`get_piper_voices_from_hf` 改用 `asyncio.to_thread` + `timeout=10`
