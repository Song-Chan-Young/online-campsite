#!/usr/bin/env python3
"""Deploy using Cloudflare's public REST APIs and curl. Default is offline inspection.
Docs: https://developers.cloudflare.com/workers/static-assets/direct-upload/
Pass --execute only after reviewing the built site and worker. No credentials are
stored in the repository; --auth-config must point to a private curl config.
"""
import argparse, base64, contextlib, hashlib, json, mimetypes, os, pathlib, re, subprocess, tempfile, uuid

ROOT = pathlib.Path(__file__).resolve().parents[1]

def secure(path, data):
    path.write_bytes(data if isinstance(data, bytes) else data.encode())
    path.chmod(0o600)
    return path

def multipart(parts):
    boundary = 'cf-' + uuid.uuid4().hex
    body = bytearray()
    for name, filename, mime, content in parts:
        body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{filename}"\r\nContent-Type: {mime}\r\n\r\n'.encode())
        body.extend(content)
        body.extend(b'\r\n')
    body.extend(f'--{boundary}--\r\n'.encode())
    return f'multipart/form-data; boundary={boundary}', bytes(body)

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--auth-config', type=pathlib.Path, required=True)
    p.add_argument('--account-id', required=True)
    p.add_argument('--execute', action='store_true')
    p.add_argument('--external-curl', type=pathlib.Path, help='Stage requests here for direct approved curl calls; rerun with identical arguments after each call')
    p.add_argument('--subdomain', default='bangguseok-camp')
    p.add_argument('--fallback-subdomain', default='channy-camp')
    a = p.parse_args()
    cfg = json.loads((ROOT / 'wrangler.jsonc').read_text())
    worker = ROOT / '.build/worker/worker.js'
    site = ROOT / cfg['assets']['directory']
    manifest, files = {}, {}
    for f in sorted(site.rglob('*')):
        if not f.is_file(): continue
        data = f.read_bytes()
        encoded = base64.b64encode(data)
        h = hashlib.sha256(encoded + f.suffix.lstrip('.').encode()).hexdigest()[:32]
        manifest['/' + f.relative_to(site).as_posix()] = {'hash': h, 'size': len(data)}
        mime = {'.mjs': 'text/javascript', '.js': 'text/javascript'}.get(f.suffix) or mimetypes.guess_type(f.name)[0] or 'application/octet-stream'
        files[h] = (f.name, mime, encoded)
    if not manifest or not worker.exists(): raise RuntimeError('Build site and bundled Worker first')
    print(f"Prepared {len(manifest)} assets and {worker.stat().st_size} Worker bytes for {cfg['name']}")
    if not a.execute:
        print('Offline inspection only. Add --execute to deploy.'); return
    if a.auth_config.stat().st_mode & 0o077: raise RuntimeError('Auth config must be private (0600)')
    os.umask(0o077)
    if a.external_curl:
        a.external_curl.mkdir(parents=True, exist_ok=True, mode=0o700)
        a.external_curl.chmod(0o700)
    storage = contextlib.nullcontext(str(a.external_curl.resolve())) if a.external_curl else tempfile.TemporaryDirectory(prefix='camp-deploy-')
    with storage as temporary:
        tmp = pathlib.Path(temporary)
        step = 0
        base = f'https://api.cloudflare.com/client/v4/accounts/{a.account_id}/workers'
        def request(path, method='GET', value=None, parts=None, jwt=None, allow_error=False):
            nonlocal step
            step += 1
            current = tmp / str(step)
            current.mkdir(mode=0o700, exist_ok=True)
            response = current / 'response.json'
            headers = current / 'headers.txt'
            if a.external_curl and headers.exists() and response.exists():
                matches = re.findall(r'(?m)^HTTP/\S+ (\d+)', headers.read_text())
                if matches:
                    status = int(matches[-1]); obj = json.loads(response.read_text())
                    if (status >= 400 or obj.get('success') is False) and not allow_error:
                        raise RuntimeError(f'Cloudflare HTTP {status}, error codes {[e.get("code") for e in obj.get("errors", [])]}')
                    return status, obj
            secure(response, b'')
            args = ['curl', '-fsS', '--no-fail', '--config', str(a.auth_config), '--request', method, '--output', str(response), '--write-out', '%{http_code}']
            if jwt:
                auth = secure(current / 'upload-auth.curl', 'header = ' + json.dumps('Authorization: Bearer ' + jwt) + '\n')
                # Use a separate config so the account bearer is never duplicated.
                args = ['curl', '-fsS', '--no-fail', '--config', str(auth), '--request', method, '--output', str(response), '--write-out', '%{http_code}']
            if value is not None or parts is not None:
                mime, payload = multipart(parts) if parts is not None else ('application/json', json.dumps(value).encode())
                body = secure(current / 'body', payload)
                args += ['--header', 'Content-Type: ' + mime, '--data-binary', '@' + str(body)]
            if a.external_curl:
                # Curl config contains all sensitive headers/body paths; only its path is printed.
                lines = ['config = ' + json.dumps(str(auth if jwt else a.auth_config.resolve())), 'url = ' + json.dumps(base + path), 'request = ' + json.dumps(method), 'output = ' + json.dumps(str(response)), 'dump-header = ' + json.dumps(str(headers))]
                if value is not None or parts is not None:
                    lines += ['header = ' + json.dumps('Content-Type: ' + mime), 'data-binary = ' + json.dumps('@' + str(body))]
                command = secure(current / 'request.curl', '\n'.join(lines) + '\n')
                print(f'Pending step {step}: {method} {path}')
                print(f'curl -fsS --no-fail --config {command}')
                raise SystemExit(0)
            result = subprocess.run(args + [base + path], capture_output=True, text=True)
            if result.returncode: raise RuntimeError(f'curl transport failed (exit {result.returncode}); no response data printed')
            status = int(result.stdout)
            try: obj = json.loads(response.read_text())
            except ValueError: raise RuntimeError(f'Cloudflare returned non-JSON HTTP {status}')
            if (status >= 400 or obj.get('success') is False) and not allow_error:
                codes = [e.get('code') for e in obj.get('errors', [])]
                raise RuntimeError(f'Cloudflare HTTP {status}, error codes {codes}')
            return status, obj
        status, sub = request('/subdomain', allow_error=True)
        if status == 404:
            for name in [a.subdomain, a.fallback_subdomain]:
                status, sub = request('/subdomain', 'PUT', {'subdomain': name}, allow_error=True)
                if status < 400 and sub.get('success') is not False: break
            else: raise RuntimeError('Could not register requested workers.dev subdomain')
        elif status >= 400: raise RuntimeError(f'Subdomain lookup failed: HTTP {status}')
        subdomain = sub['result']['subdomain']
        _, scripts = request('/scripts')
        existing = next((s for s in scripts['result'] if s.get('id') == cfg['name']), None)
        latest = existing.get('migration_tag') if existing else None
        wanted = cfg.get('migrations', [])
        if existing and wanted and latest not in [m['tag'] for m in wanted]:
            raise RuntimeError('Existing Worker migration state is unknown; inspect before deploying')
        _, session = request(f"/scripts/{cfg['name']}/assets-upload-session", 'POST', {'manifest': manifest})
        result = session['result']; token = result['jwt']; completion = token if not result['buckets'] else None
        for i, bucket in enumerate(result['buckets']):
            parts = [(h, files[h][0], files[h][1], files[h][2]) for h in bucket]
            _, uploaded = request('/assets/upload?base64=true', 'POST', parts=parts, jwt=token)
            completion = uploaded.get('result', uploaded).get('jwt') or completion
            print(f'Uploaded asset bucket {i + 1}/{len(result["buckets"])}')
        if not completion: raise RuntimeError('No asset completion token received')
        metadata = {'main_module': 'worker.js', 'compatibility_date': cfg['compatibility_date'],
                    'bindings': [{'name': cfg['assets']['binding'], 'type': 'assets'}],
                    'assets': {'jwt': completion, 'config': {'run_worker_first': cfg['assets'].get('run_worker_first', False)}}}
        for b in cfg.get('durable_objects', {}).get('bindings', []):
            metadata['bindings'].append({'name': b['name'], 'type': 'durable_object_namespace', 'class_name': b['class_name']})
        pending = wanted[next((i + 1 for i, m in enumerate(wanted) if m['tag'] == latest), 0):]
        if pending:
            metadata['migrations'] = {'new_tag': pending[-1]['tag'], 'steps': [{k:v for k,v in m.items() if k != 'tag'} for m in pending]}
            if latest: metadata['migrations']['old_tag'] = latest
        parts = [('metadata', 'metadata.json', 'application/json', json.dumps(metadata).encode()),
                 ('worker.js', 'worker.js', 'application/javascript+module', worker.read_bytes())]
        request(f"/scripts/{cfg['name']}", 'PUT', parts=parts)
        request(f"/scripts/{cfg['name']}/subdomain", 'POST', {'enabled': True, 'previews_enabled': False})
        print(f"Deployed https://{cfg['name']}.{subdomain}.workers.dev")

if __name__ == '__main__':
    try: main()
    except (RuntimeError, OSError, KeyError, ValueError) as e:
        raise SystemExit(str(e))
