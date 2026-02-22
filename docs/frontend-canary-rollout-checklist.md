# Frontend Canary Rollout Checklist

Checklist operasional untuk rollout UI Liquid Glass v2.

## 1. Stage Internal (staging)

1. Set env:
- `VITE_UI_LIQUID_GLASS_V2=1`
2. Verifikasi flow utama:
- Planner: onboarding -> doc picker -> wizard -> review -> execute
- Chat: bubble source panel, copy action, markdown table fallback
- Composer: lock reason planner + mention dropdown + send flow
3. Smoke accessibility:
- Focus ring terlihat
- Dialog doc picker bisa ditutup `Esc`
- Navigasi keyboard tab tidak terjebak

## 2. Subset User (canary)

1. Aktifkan untuk subset user internal terlebih dahulu.
2. Pantau metrik:
- Error UI runtime (console/Sentry)
- Planner completion rate
- Chat send success rate
- Time-to-first-interaction pada halaman chat
3. Generate laporan canary tiap window:
- `./venv/Scripts/python.exe manage.py frontend_canary_report --minutes 30 --user-ids 1,2 --request-prefix canary-ui-10-`
- Interpretasi cepat:
  - `Planner Completed %` naik/stabil.
  - `Chat Send success %` stabil tinggi.
  - `Send errors 5xx %` tidak naik.

## 3. Full Rollout

1. Naikkan ke seluruh user jika 2-3 window observasi stabil.
2. Simpan baseline performa build:
- main bundle size
- css bundle size
- vitest pass rate

## 3A. Canary Window Gate (Operational)

1. Internal cohort (contoh user QA internal):
- Build/deploy dengan `VITE_UI_LIQUID_GLASS_V2=1`
- Jalankan 2 window berturut:
  - `./venv/Scripts/python.exe manage.py frontend_canary_report --minutes 30 --user-ids 1,2 --request-prefix canary-ui-internal-`
2. 10-25% cohort:
- Routing traffic subset ke build flag ON.
- Jalankan 2-3 window:
  - `./venv/Scripts/python.exe manage.py frontend_canary_report --minutes 30 --request-prefix canary-ui-10-`
3. 50% cohort (opsional sebelum full):
- Jalankan 2-3 window:
  - `./venv/Scripts/python.exe manage.py frontend_canary_report --minutes 30 --request-prefix canary-ui-50-`
4. 100% rollout:
- Jalankan window stabilisasi:
  - `./venv/Scripts/python.exe manage.py frontend_canary_report --minutes 30 --request-prefix canary-ui-100-`
5. Gate naik stage:
- `Send errors 5xx` tidak meningkat signifikan.
- `Send success` stabil.
- `Planner completed` tidak turun vs baseline internal.

## 4. Rollback Cepat

1. Matikan env:
- `VITE_UI_LIQUID_GLASS_V2=0`
2. Redeploy frontend.
3. Tidak perlu perubahan backend.

## 5. Validation Log (Latest)

Tanggal validasi lokal: **22 Februari 2026**.

1. Test unit/integration (frontend):
- `npx vitest run src/pages/Chat/__tests__/Index.phase4.test.tsx src/components/planner/__tests__/PlannerDocPickerSheet.test.tsx src/components/planner/__tests__/PlannerOnboardingCard.test.tsx src/components/molecules/__tests__/ChatComposer.test.tsx`
- Hasil: **pass**.
2. E2E phase4 (flag ON):
- `VITE_UI_LIQUID_GLASS_V2=1 npm run e2e:phase4`
- Hasil: **pass** (flow planner onboarding/doc-picker/wizard/review + upload flow).
3. E2E mobile (flag ON):
- `VITE_UI_LIQUID_GLASS_V2=1 npm run e2e:mobile`
- Hasil: **pass**.
4. Build production (flag ON):
- `VITE_UI_LIQUID_GLASS_V2=1 npm run build`
- Hasil: **pass**.
- Catatan: warning chunk `main` > 500 kB masih ada; lanjutkan code-splitting bertahap.
5. Command monitoring canary frontend:
- `python manage.py frontend_canary_report --minutes 30 --user-ids <cohort_ids> --request-prefix <prefix>`
- Status: **tersedia** dan siap dipakai pada rollout internal/subset/full.
