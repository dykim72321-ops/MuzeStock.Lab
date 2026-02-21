import os
import aiohttp
from datetime import datetime

class WebhookManager:
    def __init__(self):
        # 환경변수에서 디스코드 웹훅 URL 로드 (사용자가 .env에 DISCORD_WEBHOOK_URL 추가 필요)
        self.webhook_url = os.getenv("DISCORD_WEBHOOK_URL")

    async def send_alert(self, title: str, description: str, color: int = 0x3498db, fields: list = None):
        if not self.webhook_url:
            print("⚠️ DISCORD_WEBHOOK_URL not set. Skipping alert.")
            return

        payload = {
            "embeds": [{
                "title": title,
                "description": description,
                "color": color,
                "timestamp": datetime.utcnow().isoformat(),
                "footer": {
                    "text": "MuzeStock.Lab Quant Engine"
                }
            }]
        }

        if fields:
            payload["embeds"][0]["fields"] = fields

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.webhook_url, json=payload) as response:
                    if response.status not in (200, 204):
                        print(f"❌ Webhook Error: {response.status} - {await response.text()}")
        except Exception as e:
            print(f"❌ Failed to send webhook: {e}")
