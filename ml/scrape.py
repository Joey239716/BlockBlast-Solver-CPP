"""
scrape.py — Download Block Blast screenshots from r/blockblast (help posts).

Uses Reddit's public JSON API — no API key required.

Usage:
    pip install requests
    python scrape.py
"""

import os
import time
import requests

OUT_DIR   = os.path.join(os.path.dirname(__file__), "screenshots")
MAX_POSTS = 300   # how many posts to scan
DELAY     = 1.0   # seconds between requests (be polite)

HEADERS = {"User-Agent": "BlockBlastScraper/1.0 (educational dataset collection)"}

IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def fetch_posts(subreddit: str, limit: int = 300):
    """Yield post data dicts from a subreddit, paginating with 'after'."""
    url  = f"https://www.reddit.com/r/{subreddit}/search.json"
    params = {
        "q":       "help",
        "sort":    "new",
        "limit":   100,
        "restrict_sr": True,
        "t":       "all",
    }
    after = None
    fetched = 0

    while fetched < limit:
        if after:
            params["after"] = after

        try:
            r = requests.get(url, headers=HEADERS, params=params, timeout=15)
            r.raise_for_status()
        except requests.RequestException as e:
            print(f"  Request error: {e}")
            break

        data     = r.json()
        children = data.get("data", {}).get("children", [])
        if not children:
            break

        for child in children:
            yield child["data"]
            fetched += 1

        after = data["data"].get("after")
        if not after:
            break

        time.sleep(DELAY)


def image_urls_from_post(post: dict):
    """Extract direct image URLs from a post dict."""
    urls = []

    # Direct image link
    url = post.get("url", "")
    ext = os.path.splitext(url.lower())[1]
    if ext in IMG_EXTS:
        urls.append(url)

    # Reddit-hosted image (i.redd.it)
    if "i.redd.it" in url:
        urls.append(url)

    # Gallery posts
    if post.get("is_gallery") and post.get("media_metadata"):
        for item in post["media_metadata"].values():
            if item.get("status") == "valid" and item.get("s"):
                src = item["s"].get("u") or item["s"].get("gif")
                if src:
                    urls.append(src.replace("&amp;", "&"))

    # Preview image as fallback
    try:
        preview_url = post["preview"]["images"][0]["source"]["url"].replace("&amp;", "&")
        if preview_url and not urls:
            urls.append(preview_url)
    except (KeyError, IndexError):
        pass

    return list(dict.fromkeys(urls))  # deduplicate, preserve order


def download(url: str, path: str) -> bool:
    try:
        r = requests.get(url, headers=HEADERS, timeout=20, stream=True)
        r.raise_for_status()
        with open(path, "wb") as f:
            for chunk in r.iter_content(8192):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"    Failed: {e}")
        return False


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    existing = set(os.listdir(OUT_DIR))

    print(f"Scanning r/blockblast for help posts (target: {MAX_POSTS} posts)…\n")
    saved = 0
    scanned = 0

    for post in fetch_posts("blockblast", limit=MAX_POSTS):
        scanned += 1
        title = post.get("title", "")[:60]
        urls  = image_urls_from_post(post)

        if not urls:
            continue

        for i, img_url in enumerate(urls):
            ext      = os.path.splitext(img_url.lower().split("?")[0])[1] or ".jpg"
            filename = f"{post['id']}_{i}{ext}"
            if filename in existing:
                continue

            path = os.path.join(OUT_DIR, filename)
            ok   = download(img_url, path)
            if ok:
                saved += 1
                existing.add(filename)
                print(f"  [{saved:>3}] {title}  →  {filename}")
            time.sleep(0.3)

    print(f"\nDone — scanned {scanned} posts, saved {saved} images to screenshots/")


if __name__ == "__main__":
    main()
