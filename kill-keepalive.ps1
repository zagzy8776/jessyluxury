Get-WmiObject Win32_Process -Filter "Name='node.exe'" |
  ForEach-Object {
    $cl = $_.CommandLine
    if ($cl -and ($cl -like '*keepalive*')) {
      Write-Output ("Stopping node PID " + $_.ProcessId)
      Stop-Process -Id $_.ProcessId -Force
    }
  }
