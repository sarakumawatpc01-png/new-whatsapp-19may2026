$ErrorActionPreference = "Continue"
Write-Output "===API==="
Set-Location C:\Users\Infinix\dyad-apps\curious-unicorn-snap\apps\api
npx tsc --noEmit 2>&1 | Out-String

Write-Output "===WEB==="
Set-Location C:\Users\Infinix\dyad-apps\curious-unicorn-snap\apps\web
npx tsc --noEmit 2>&1 | Out-String

Write-Output "===ADMIN==="
Set-Location C:\Users\Infinix\dyad-apps\curious-unicorn-snap\apps\admin
npx tsc --noEmit 2>&1 | Out-String

Write-Output "===WORKER==="
Set-Location C:\Users\Infinix\dyad-apps\curious-unicorn-snap\apps\worker
npx tsc --noEmit 2>&1 | Out-String

Write-Output "===AI==="
Set-Location C:\Users\Infinix\dyad-apps\curious-unicorn-snap\packages\ai
npx tsc --noEmit 2>&1 | Out-String

Write-Output "===BILLING==="
Set-Location C:\Users\Infinix\dyad-apps\curious-unicorn-snap\packages\billing
npx tsc --noEmit 2>&1 | Out-String

Write-Output "===DATABASE==="
Set-Location C:\Users\Infinix\dyad-apps\curious-unicorn-snap\packages\database
$env:DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
npx prisma validate 2>&1 | Out-String

Set-Location C:\Users\Infinix\dyad-apps\curious-unicorn-snap
Write-Output "===LINT==="
pnpm lint --no-bail 2>&1 | Out-String
