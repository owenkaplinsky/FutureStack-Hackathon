import asyncio
asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import sys
from playwright.sync_api import sync_playwright, Error as PlaywrightError

def resolve_url(url: str) -> str:
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=7000)
                try:
                    page.wait_for_load_state("networkidle", timeout=5000)
                except Exception:
                    pass
                final_url = page.evaluate("window.location.href")
            except Exception as e:
                final_url = f"ERROR: navigation failed ({e})"
            browser.close()
            return final_url
    except PlaywrightError as e:
        return f"ERROR: Playwright failed ({e})"
    except Exception as e:
        return f"ERROR: unexpected failure ({e})"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("ERROR: no URL provided")
        sys.exit(0)  # exit normally, no crash
    url = sys.argv[1]
    print(resolve_url(url))
