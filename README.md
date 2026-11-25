# Reportes UTVT

Aplicación móvil para registrar y dar seguimiento a reportes de mantenimiento universitario
(cómputo, iluminación, mobiliario, internet e instalaciones eléctricas).

- App: React Native 0.88 + Expo SDK 58, TypeScript, Expo Router
- Nube: Supabase (Auth, API REST, PostgreSQL con Row Level Security y Storage privado)

## 1. Crear el backend en Supabase

1. Crea un proyecto gratuito en https://supabase.com.
2. Ve a **SQL Editor → New query**, pega todo `supabase/schema.sql` y presiona **Run**.
3. Para la demostración, en **Authentication → Sign In / Providers → Email** desactiva
   **Confirm email** (así la cuenta se puede usar en cuanto se crea).
4. Copia la **Project URL** y la **anon public key** de **Project Settings → API**.

## 2. Configurar y correr la app

```bash
cp .env.example .env        # en Windows: copy .env.example .env
# pon la URL y la anon key en .env
npm install
npx expo start
```

Escanea el código QR con **Expo Go** (Android o iOS). El celular y la computadora deben estar
en la misma red; si no, usa `npx expo start --tunnel`.

## 3. Crear un usuario de mantenimiento

Todas las cuentas nuevas son `reportante`. Para probar el rol de mantenimiento, registra una
cuenta desde la app y en **SQL Editor** ejecuta:

```sql
update public.profiles set role = 'mantenimiento'
where id = (select id from auth.users where email = 'correo@ejemplo.com');
```

## Seguridad

- La app solo usa la llave pública (anon). La `service_role` nunca va en la app.
- Las políticas RLS hacen que cada usuario vea solo sus reportes y fotos; el personal de
  mantenimiento ve todos y solo puede cambiar el estado; nadie puede borrar reportes.
- El servidor fija el dueño, el estado inicial y la fecha del reporte, y limita a 10 reportes por hora.
- La sesión se guarda cifrada (AES-256, llave en Keystore/Keychain).
- `.env` no se sube al repositorio.
