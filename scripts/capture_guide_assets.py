import os
import sys
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
        device_scale_factor=2  # High resolution retina screenshots!
    )
    page = context.new_page()

    # 1. Capture Upload Zone / Landing Page
    print('Navigating to http://localhost:3000...')
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)

    # Make sure we're on the landing view
    home_btn = page.locator('button:has-text("Home"), a:has-text("Home")')
    print('Home buttons:', home_btn.count())

    shot_landing = os.path.join(output_dir, '01_landing_terminal.png')
    page.screenshot(path=shot_landing)
    print('Saved:', shot_landing)

    # 2. Upload Demo CSV file
    file_input = page.locator('input[accept*=".csv"]').first
    file_input.set_input_files(csv_path)
    print('Uploaded demo CSV, waiting for state update...')
    page.wait_for_timeout(2500)

    # 3. Main Dashboard Leaderboard
    shot_dashboard = os.path.join(output_dir, '02_main_leaderboard.png')
    page.screenshot(path=shot_dashboard)
    print('Saved:', shot_dashboard)

    # 4. Open Scoring Weights & Constraints Drawer
    filter_btn = page.locator('button:has-text("Weights & Rules"), button:has-text("Filters"), button:has-text("Scoring Weights")')
    if filter_btn.count() > 0:
        filter_btn.first.click()
        page.wait_for_timeout(800)
        shot_drawer = os.path.join(output_dir, '03_scoring_rules_drawer.png')
        page.screenshot(path=shot_drawer)
        print('Saved:', shot_drawer)
        # Close drawer
        close_btn = page.locator('button[aria-label="Close"], button:has-text("Close"), svg.lucide-x').first
        if close_btn.count() > 0:
            close_btn.click()
            page.wait_for_timeout(500)

    # 5. Open Squad Detail Modal
    view_btn = page.locator('button:has-text("View Squad"), button:has-text("Inspect"), button:has-text("View")').first
    if view_btn.count() > 0:
        view_btn.click()
        page.wait_for_timeout(1000)
        shot_squad = os.path.join(output_dir, '04_squad_dossier_modal.png')
        page.screenshot(path=shot_squad)
        print('Saved:', shot_squad)
        # Close modal (ESC or close button)
        page.keyboard.press('Escape')
        page.wait_for_timeout(500)

    # 6. Open Pairwise Compare Modal
    compare_btn = page.locator('button:has-text("Compare")').first
    if compare_btn.count() > 0:
        compare_btn.click()
        page.wait_for_timeout(1000)
        shot_compare = os.path.join(output_dir, '05_pairwise_compare_modal.png')
        page.screenshot(path=shot_compare)
        print('Saved:', shot_compare)
        page.keyboard.press('Escape')
        page.wait_for_timeout(500)

    # 7. Open Column Mapper Modal
    mapper_btn = page.locator('button:has-text("Column Map"), button:has-text("Columns")').first
    if mapper_btn.count() > 0:
        mapper_btn.click()
        page.wait_for_timeout(800)
        shot_mapper = os.path.join(output_dir, '06_column_mapper_modal.png')
        page.screenshot(path=shot_mapper)
        print('Saved:', shot_mapper)
        page.keyboard.press('Escape')
        page.wait_for_timeout(500)

    # 8. Open Resume Sync Modal
    resume_btn = page.locator('button:has-text("Resume Sync"), button:has-text("Resumes")').first
    if resume_btn.count() > 0:
        resume_btn.click()
        page.wait_for_timeout(800)
        shot_resume = os.path.join(output_dir, '07_resume_sync_modal.png')
        page.screenshot(path=shot_resume)
        print('Saved:', shot_resume)
        page.keyboard.press('Escape')
        page.wait_for_timeout(500)

    # 9. Navigate to Formula & Algorithm Studio
    page.goto('http://localhost:3000/formulas', wait_until='networkidle')
    page.wait_for_timeout(1000)
    shot_formulas = os.path.join(output_dir, '08_formula_studio.png')
    page.screenshot(path=shot_formulas)
    print('Saved:', shot_formulas)

    browser.close()
    print('ALL ASSETS CAPTURED SUCCESSFULLY!')
