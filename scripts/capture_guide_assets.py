import os
import time
from playwright.sync_api import sync_playwright

output_dir = os.path.abspath('public/guide_assets')
os.makedirs(output_dir, exist_ok=True)
csv_path = os.path.abspath('public/demo_hackathon_registrations.csv')

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path='C:/Program Files/Google/Chrome/Application/chrome.exe',
        headless=True
    )
    context = browser.new_context(
        viewport={'width': 1600, 'height': 1000},
        device_scale_factor=2
    )
    page = context.new_page()

    # 1. Landing Terminal
    print("Capturing 01_landing_terminal...")
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, '01_landing_terminal.png'))

    # 2. Upload CSV
    print("Uploading CSV...")
    file_input = page.locator('input[accept*=".csv"]').first
    file_input.set_input_files(csv_path)
    page.wait_for_timeout(2000)

    # 2b. Main Leaderboard
    print("Capturing 02_main_leaderboard...")
    page.screenshot(path=os.path.join(output_dir, '02_main_leaderboard.png'))

    # 3. Scoring Rules Drawer
    print("Capturing 03_scoring_rules_drawer...")
    rules_btn = page.locator('button:has-text("Weights & Rules"), button:has-text("Filters")').first
    if rules_btn.count() > 0:
        rules_btn.click()
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(output_dir, '03_scoring_rules_drawer.png'))
        # Close drawer by clicking backdrop or close button
        page.locator('button:has-text("Close"), svg.lucide-x').first.click()
        page.wait_for_timeout(500)

    # 4. Squad Dossier Modal (View Squad)
    print("Capturing 04_squad_dossier_modal...")
    # Find the first 'Inspect Squad' or eye button or 'NeuralSync' row
    view_btn = page.locator('button[title*="Inspect"], button:has-text("Inspect"), button:has-text("View Squad")').first
    if view_btn.count() > 0:
        view_btn.click()
    else:
        # Click on the first row's team name
        page.locator('text=NeuralSync').first.click()
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, '04_squad_dossier_modal.png'))
    # Close modal
    page.locator('div[role="dialog"] button:has(svg.lucide-x), button:has(svg.lucide-x)').first.click()
    page.wait_for_timeout(500)

    # Reload page to ensure clean state
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)

    # 5. Pairwise Compare Modal
    print("Capturing 05_pairwise_compare_modal...")
    compare_btn = page.locator('button:has-text("Compare")').first
    if compare_btn.count() > 0:
        compare_btn.click()
        page.wait_for_timeout(1000)
        page.screenshot(path=os.path.join(output_dir, '05_pairwise_compare_modal.png'))

    # Reload page
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)

    # 6. Column Mapper Modal
    print("Capturing 06_column_mapper_modal...")
    mapper_btn = page.locator('button:has-text("Column Map"), button[title*="Column Mapping"]').first
    if mapper_btn.count() > 0:
        mapper_btn.click()
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(output_dir, '06_column_mapper_modal.png'))

    # Reload page
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)

    # 7. Resume Sync Modal
    print("Capturing 07_resume_sync_modal...")
    resume_btn = page.locator('button:has-text("Resume Sync"), button:has-text("Resumes")').first
    if resume_btn.count() > 0:
        resume_btn.click()
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(output_dir, '07_resume_sync_modal.png'))

    # Reload page
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)

    # 8. Parallel Sync / GitHub Sync Modal
    print("Capturing 08_parallel_sync_modal...")
    sync_btn = page.locator('button:has-text("Parallel Sync"), button:has-text("GitHub Sync")').first
    if sync_btn.count() > 0:
        sync_btn.click()
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(output_dir, '08_parallel_sync_modal.png'))

    # 9. Formula & Algorithm Studio
    print("Capturing 09_formula_studio...")
    page.goto('http://localhost:3000/formulas', wait_until='networkidle')
    page.wait_for_timeout(1200)
    page.screenshot(path=os.path.join(output_dir, '09_formula_studio.png'))

    # 10. Sensitivity Analysis Modal
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)
    print("Capturing 10_sensitivity_modal...")
    sens_btn = page.locator('button:has-text("Sensitivity"), button[title*="Sensitivity"]').first
    if sens_btn.count() > 0:
        sens_btn.click()
        page.wait_for_timeout(800)
        page.screenshot(path=os.path.join(output_dir, '10_sensitivity_modal.png'))

    browser.close()
    print("ALL 10 GUIDE ASSETS CAPTURED CLEANLY!")
