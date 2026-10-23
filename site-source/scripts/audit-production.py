"""Read-only HTTP and content verification of the actual GitHub Pages deployment."""
import concurrent.futures, hashlib, json, os, pathlib, urllib.error, urllib.request
base = 'https://569001773-wq.github.io/lyrictap-support/'
root = pathlib.Path('_site')
commit = os.getenv('GITHUB_SHA', 'acceptance')

def check(file):
    relative = file.relative_to(root).as_posix()
    path = relative.removesuffix('index.html') if relative.endswith('index.html') else relative
    url = base + path
    try:
        response = urllib.request.urlopen(url + '?deployment_check=' + commit, timeout=30)
        actual = response.read()
        expected = file.read_bytes()
        return {'url': url, 'status': response.status, 'bytes': len(actual),
                'matches_build': actual == expected, 'sha256': hashlib.sha256(actual).hexdigest()}
    except Exception as e:
        return {'url': url, 'error': str(e), 'matches_build': False}

# version.json is generated with the build commit only by artifact deployments.
# The legacy branch copy intentionally has no version marker.
files = [p for p in root.rglob('*') if p.is_file() and p.name not in ['version.json', '.nojekyll']]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(check, files))
try:
    urllib.request.urlopen(base + 'missing-acceptance-page/', timeout=30)
    missing_status = 200
except urllib.error.HTTPError as e:
    missing_status = e.code
except Exception as e:
    missing_status = str(e)
try:
    robots = urllib.request.urlopen('https://569001773-wq.github.io/robots.txt', timeout=30)
    robots_status = robots.status
except urllib.error.HTTPError as e:
    robots_status = e.code
except Exception as e:
    robots_status = str(e)
failed = [r for r in results if not r.get('matches_build') or r.get('status') != 200]
# The unknown-path probe above must return 404; canonical pages and directly
# requested assets (including the 404.html template itself) must return 200.
report = {'files_checked': len(results), 'failed': failed, 'missing_path_status': missing_status,
          'origin_robots_status': robots_status, 'results': results,
          'note': 'HTTP/content verification is not proof of search indexation.'}
pathlib.Path('artifacts').mkdir(exist_ok=True)
pathlib.Path('artifacts/production-audit.json').write_text(json.dumps(report, indent=2))
print(json.dumps({k:v for k,v in report.items() if k != 'results'}, indent=2))
if failed or missing_status != 404:
    raise SystemExit(1)
