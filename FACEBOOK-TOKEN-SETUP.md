# 🔑 Configuración de Facebook Access Token e Instagram Account ID

## ⚠️ Token Actual: EXPIRADO

El token actual expiró el **3 de diciembre de 2025**. Necesitas generar uno nuevo.

---

## 📋 Pasos para Obtener Nuevo Token

### **Paso 1: Ir a Facebook Graph API Explorer**

1. Ve a: https://developers.facebook.com/tools/explorer
2. Inicia sesión con tu cuenta de Facebook

### **Paso 2: Seleccionar o Crear App**

1. En el dropdown **"Meta App"** (arriba a la izquierda):
   - Si ya tienes una app, selecciónala
   - Si no, haz clic en **"Create App"** y crea una nueva

### **Paso 3: Configurar Permisos**

1. Haz clic en el botón **"Get Token"** → **"Get User Access Token"**
2. En la ventana de permisos, selecciona estos scopes:
   - ✅ `instagram_basic`
   - ✅ `instagram_content_publish`
   - ✅ `pages_show_list`
   - ✅ `pages_read_engagement`
   - ✅ `business_management` (opcional pero recomendado)

3. Haz clic en **"Generate Access Token"**
4. Autoriza la aplicación cuando te lo pida

### **Paso 4: Copiar el Token**

1. El token aparecerá en el campo **"Access Token"**
2. **Copia el token completo** (es largo, asegúrate de copiarlo todo)

### **Paso 5: Obtener Instagram Account ID**

Una vez que tengas el nuevo token, ejecuta este comando:

```bash
curl "https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account{id,username,name,profile_picture_url},name&access_token=TU_NUEVO_TOKEN_AQUI"
```

**Respuesta esperada:**
```json
{
  "data": [
    {
      "name": "Nombre de tu Página",
      "id": "PAGE_ID",
      "instagram_business_account": {
        "id": "INSTAGRAM_ACCOUNT_ID",
        "username": "tu_instagram_username",
        "name": "Nombre Instagram",
        "profile_picture_url": "https://..."
      }
    }
  ]
}
```

**El `instagram_business_account.id` es el `INSTAGRAM_ACCOUNT_ID` que necesitas.**

---

## 🔄 Convertir Token a Long-Lived Token (Opcional pero Recomendado)

Los tokens de usuario expiran en 1-2 horas. Para obtener un token de larga duración (60 días):

### **Opción A: Desde Graph API Explorer**

1. En Graph API Explorer, haz clic en **"Get Token"** → **"Get Long-Lived Token"
2. Esto te dará un token que dura ~60 días

### **Opción B: Usando API**

```bash
curl "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=TU_APP_ID&client_secret=TU_APP_SECRET&fb_exchange_token=TU_SHORT_LIVED_TOKEN"
```

**Nota:** Necesitas `APP_ID` y `APP_SECRET` de tu app de Facebook.

---

## 📝 Variables de Entorno a Configurar

Una vez que tengas el nuevo token y el Instagram Account ID:

```env
FACEBOOK_ACCESS_TOKEN=tu_nuevo_token_aqui
INSTAGRAM_ACCOUNT_ID=tu_instagram_account_id_aqui
```

---

## ✅ Verificación

Después de configurar las variables, puedes verificar que funcionan:

```bash
# Verificar token
curl "https://graph.facebook.com/v21.0/me?access_token=TU_TOKEN"

# Verificar Instagram Account ID
curl "https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account&access_token=TU_TOKEN"
```

---

## 🚨 Troubleshooting

### **Error: "Session has expired"**
- El token expiró, necesitas generar uno nuevo
- Los tokens de usuario duran 1-2 horas
- Los tokens de larga duración duran ~60 días

### **Error: "Invalid OAuth access token"**
- Verifica que copiaste el token completo
- Asegúrate de no tener espacios al inicio/final
- Verifica que el token no haya expirado

### **Error: "No Instagram Business Account found"**
- Tu página de Facebook debe tener una cuenta de Instagram Business conectada
- Ve a tu página de Facebook → Settings → Instagram
- Conecta tu cuenta de Instagram Business

### **No veo "instagram_business_account" en la respuesta**
- Tu página no tiene Instagram Business conectado
- Conecta Instagram Business a tu página primero
- Ve a: Facebook Page → Settings → Instagram → Connect Account

---

## 📚 Referencias

- **Graph API Explorer:** https://developers.facebook.com/tools/explorer
- **Instagram Graph API Docs:** https://developers.facebook.com/docs/instagram-api
- **Access Tokens:** https://developers.facebook.com/docs/facebook-login/guides/access-tokens







