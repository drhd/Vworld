# app/ — کد بات دیوان

این پوشه در **اسپرینت ۱** پر می‌شود (بعد از تصمیم منبع کد — بخش ۳ سند بازبینی).

ساختار هدف (از HANDOVER §13 + دو بهبود سند بازبینی):
```
config.py · db.py · jdate.py · storage.py(جدید) · ai.py
core/services/(جدید — کل منطق کسب‌وکار)
keyboards.py · bot.py · worker.py
handlers/ (common · entities · meetings · tasks · admin)
```
