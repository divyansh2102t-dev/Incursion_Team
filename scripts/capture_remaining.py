import os
from playwright.sync_api import sync_playwright

output_dir = os.path.abspath('public/guide_assets')
os.makedirs(output_dir, exist_ok=True)

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

    # 6. Column Mapper Modal
    print("Navigating to http://localhost:3000...")
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)
    
    mapper_btn = page.locator('button[title*="Column Mapping"], button:has-text("Column Map")').first
    if mapper_btn.count() > 0:
        mapper_btn.click()
        page.wait_for_timeout(1000)
        page.screenshot(path=os.path.join(output_dir, '06_column_mapper_modal.png'))
        print("Captured 06_column_mapper_modal")

    # 7. Resume Sync Modal
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)
    resume_btn = page.locator('button:has-text("Resume Sync"), button[title*="Resume"]').first
    if resume_btn.count() > 0:
        resume_btn.click()
        page.wait_for_timeout(1000)
        page.screenshot(path=os.path.join(output_dir, '07_resume_sync_modal.png'))
        print("Captured 07_resume_sync_modal")

    # 8. Parallel Sync / GitHub Sync Modal
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)
    sync_btn = page.locator('button:has-text("Parallel Sync"), button:has-text("GitHub Sync"), button[title*="GitHub"]').first
    if sync_btn.count() > 0:
        sync_btn.click()
        page.wait_for_timeout(1000)
        page.screenshot(path=os.path.join(output_dir, '08_parallel_sync_modal.png'))
        print("Captured 08_parallel_sync_modal")

    # 9. Formula & Algorithm Studio
    page.goto('http://localhost:3000/formulas', wait_until='networkidle')
    page.wait_for_timeout(1500)
    page.screenshot(path=os.path.join(output_dir, '09_formula_studio.png'))
    print("Captured 09_formula_studio")

    # 10. Sensitivity Modal
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.wait_for_timeout(1000)
    sens_btn = page.locator('button:has-text("Sensitivity"), button[title*="Sensitivity"]').first
    if sens_btn.count() > 0:
        sens_btn.click()
        page.wait_for_timeout(1000)
        page.screenshot(path=os.path.join(output_dir, '10_sensitivity_modal.png'))
        print("Captured 10_sensitivity_modal")

    browser.close()
    print("Done capturing remaining assets!")
