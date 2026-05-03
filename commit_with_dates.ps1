$startDate = Get-Date -Year 2026 -Month 4 -Day 24 -Hour 10 -Minute 0 -Second 0

# Get all untracked files in the current repository
$files = git ls-files -o --exclude-standard

$commitsPerDay = 17
$fileCounter = 0
$currentDate = $startDate

foreach ($file in $files) {
    # Every 17 commits, advance the date by 1 day
    if ($fileCounter -gt 0 -and $fileCounter % $commitsPerDay -eq 0) {
        $currentDate = $currentDate.AddDays(1)
    }

    # Also add a random few minutes just so they aren't at the exact same second
    $commitDateString = $currentDate.AddMinutes((Get-Random -Minimum 1 -Maximum 60)).ToString("o")

    # Set the environment variables for Git
    $env:GIT_AUTHOR_DATE = $commitDateString
    $env:GIT_COMMITTER_DATE = $commitDateString

    # Add and commit
    Write-Host "Committing $file on $($currentDate.ToString('yyyy-MM-dd'))"
    git add $file
    git commit -m "Add $file"

    $fileCounter++
}

# Cleanup environment variables
Remove-Item Env:\GIT_AUTHOR_DATE
Remove-Item Env:\GIT_COMMITTER_DATE

Write-Host "Done! Backdated $fileCounter commits."
