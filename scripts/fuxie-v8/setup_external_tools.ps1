param(
    [string]$WorkspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
    [string]$PythonExe = "py -3.10",
    [switch]$SkipClone
)

$ErrorActionPreference = "Stop"

$Ai3dRoot = Join-Path $WorkspaceRoot ".ai3d"
$ExternalRoot = Join-Path $Ai3dRoot "external"
$CacheRoot = Join-Path $Ai3dRoot "cache"
$HunyuanRoot = Join-Path $ExternalRoot "Hunyuan3D-2.1"
$UniRigRoot = Join-Path $ExternalRoot "UniRig"

New-Item -ItemType Directory -Force -Path $ExternalRoot, $CacheRoot | Out-Null

if (-not $SkipClone) {
    if (-not (Test-Path $HunyuanRoot)) {
        git clone https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1.git $HunyuanRoot
    }
    if (-not (Test-Path $UniRigRoot)) {
        git clone https://github.com/VAST-AI-Research/UniRig.git $UniRigRoot
    }
}

Write-Host "External tool roots:"
Write-Host "  Hunyuan3D: $HunyuanRoot"
Write-Host "  UniRig:    $UniRigRoot"
Write-Host ""
Write-Host "Next manual setup steps depend on the checked-out upstream requirements."
Write-Host "Use Python 3.10/3.11 virtual environments, install the official requirements, then run candidate generation into:"
Write-Host "  blender/fuxie/hunyuan_v8/candidates/"
