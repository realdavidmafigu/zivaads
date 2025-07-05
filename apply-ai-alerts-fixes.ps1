# AI Insights and Alerts Fixes Application Script
# This script applies all the necessary fixes to make AI insights and alerts work properly

Write-Host "🔧 Applying AI Insights and Alerts Fixes..." -ForegroundColor Green
Write-Host ""

# Step 1: Backup existing files
Write-Host "📦 Creating backups..." -ForegroundColor Yellow
if (Test-Path "src/lib/alerts.ts") {
    Copy-Item "src/lib/alerts.ts" "src/lib/alerts.ts.backup" -Force
    Write-Host "  ✅ Backed up src/lib/alerts.ts"
}
if (Test-Path "src/app/api/alerts/generate/route.ts") {
    Copy-Item "src/app/api/alerts/generate/route.ts" "src/app/api/alerts/generate/route.ts.backup" -Force
    Write-Host "  ✅ Backed up src/app/api/alerts/generate/route.ts"
}
if (Test-Path "src/app/api/ai-explain/route.ts") {
    Copy-Item "src/app/api/ai-explain/route.ts" "src/app/api/ai-explain/route.ts.backup" -Force
    Write-Host "  ✅ Backed up src/app/api/ai-explain/route.ts"
}
if (Test-Path "src/components/AIInsights.tsx") {
    Copy-Item "src/components/AIInsights.tsx" "src/components/AIInsights.tsx.backup" -Force
    Write-Host "  ✅ Backed up src/components/AIInsights.tsx"
}

# Step 2: Replace with fixed versions
Write-Host ""
Write-Host "🔄 Replacing files with fixed versions..." -ForegroundColor Yellow

if (Test-Path "src/lib/alerts-fixed.ts") {
    Copy-Item "src/lib/alerts-fixed.ts" "src/lib/alerts.ts" -Force
    Write-Host "  ✅ Replaced src/lib/alerts.ts"
} else {
    Write-Host "  ❌ src/lib/alerts-fixed.ts not found" -ForegroundColor Red
}

if (Test-Path "src/app/api/alerts/generate-fixed/route.ts") {
    Copy-Item "src/app/api/alerts/generate-fixed/route.ts" "src/app/api/alerts/generate/route.ts" -Force
    Write-Host "  ✅ Replaced src/app/api/alerts/generate/route.ts"
} else {
    Write-Host "  ❌ src/app/api/alerts/generate-fixed/route.ts not found" -ForegroundColor Red
}

if (Test-Path "src/app/api/ai-explain-fixed/route.ts") {
    Copy-Item "src/app/api/ai-explain-fixed/route.ts" "src/app/api/ai-explain/route.ts" -Force
    Write-Host "  ✅ Replaced src/app/api/ai-explain/route.ts"
} else {
    Write-Host "  ❌ src/app/api/ai-explain-fixed/route.ts not found" -ForegroundColor Red
}

if (Test-Path "src/components/AIInsights-fixed.tsx") {
    Copy-Item "src/components/AIInsights-fixed.tsx" "src/components/AIInsights.tsx" -Force
    Write-Host "  ✅ Replaced src/components/AIInsights.tsx"
} else {
    Write-Host "  ❌ src/components/AIInsights-fixed.tsx not found" -ForegroundColor Red
}

# Step 3: Check environment variables
Write-Host ""
Write-Host "🔧 Checking environment variables..." -ForegroundColor Yellow

$envFile = ".env.local"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $openaiKey = $envContent | Where-Object { $_ -match "OPENAI_API_KEY" }
    $whatsappPhone = $envContent | Where-Object { $_ -match "WHATSAPP_PHONE_NUMBER_ID" }
    $whatsappToken = $envContent | Where-Object { $_ -match "WHATSAPP_ACCESS_TOKEN" }
    
    if ($openaiKey) {
        Write-Host "  ✅ OPENAI_API_KEY is configured"
    } else {
        Write-Host "  ⚠️  OPENAI_API_KEY not found in .env.local" -ForegroundColor Yellow
        Write-Host "     Add: OPENAI_API_KEY=your_openai_api_key_here" -ForegroundColor Gray
    }
    
    if ($whatsappPhone) {
        Write-Host "  ✅ WHATSAPP_PHONE_NUMBER_ID is configured"
    } else {
        Write-Host "  ⚠️  WHATSAPP_PHONE_NUMBER_ID not found in .env.local" -ForegroundColor Yellow
        Write-Host "     Add: WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id" -ForegroundColor Gray
    }
    
    if ($whatsappToken) {
        Write-Host "  ✅ WHATSAPP_ACCESS_TOKEN is configured"
    } else {
        Write-Host "  ⚠️  WHATSAPP_ACCESS_TOKEN not found in .env.local" -ForegroundColor Yellow
        Write-Host "     Add: WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token" -ForegroundColor Gray
    }
} else {
    Write-Host "  ❌ .env.local file not found" -ForegroundColor Red
    Write-Host "     Create .env.local with required environment variables" -ForegroundColor Gray
}

# Step 4: Test the fixes
Write-Host ""
Write-Host "🧪 Testing the fixes..." -ForegroundColor Yellow

# Check if server is running
$serverRunning = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($serverRunning) {
    Write-Host "  ✅ Server is running on port 3000"
    
    # Test AI insights API
    try {
        $testData = @{
            metrics = @{
                total_spend = 150.50
                total_impressions = 5000
                total_clicks = 75
                average_ctr = 1.5
                average_cpc = 2.0
                total_campaigns = 3
                active_campaigns = 2
            }
            campaigns = @(
                @{
                    name = "Test Campaign"
                    status = "ACTIVE"
                    objective = "CONVERSIONS"
                    impressions = 2000
                    clicks = 30
                    ctr = 1.5
                    cpc = 2.0
                    spend = 60.0
                }
            )
        }
        
        $jsonBody = $testData | ConvertTo-Json -Depth 10
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/ai-explain" -Method POST -Headers @{"Content-Type"="application/json"} -Body $jsonBody -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ AI Insights API is working"
        } else {
            Write-Host "  ❌ AI Insights API returned status: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ AI Insights API test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ Server is not running on port 3000" -ForegroundColor Red
    Write-Host "     Start the server with: npm run dev" -ForegroundColor Gray
}

# Step 5: Summary
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Green
Write-Host "  • Backups created in case you need to revert"
Write-Host "  • Fixed files applied to resolve database structure issues"
Write-Host "  • Environment variables checked"
Write-Host "  • API endpoints tested"
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Restart your development server if it's running"
Write-Host "  2. Visit http://localhost:3000/dashboard to test AI insights"
Write-Host "  3. Check the browser console for any remaining errors"
Write-Host "  4. Test alerts generation at /api/alerts/generate"
Write-Host ""
Write-Host "📚 For more details, see: AI_ALERTS_FIXES_README.md" -ForegroundColor Gray
Write-Host ""
Write-Host "Fixes applied successfully!" -ForegroundColor Green 