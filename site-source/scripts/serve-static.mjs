import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('_site');const prefix='/lyrictap-support/';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.xml':'application/xml','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
createServer(async(req,res)=>{
 try{
  let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/lyrictap-support'){res.writeHead(301,{Location:prefix});return res.end();}
  if(!path.startsWith(prefix))throw new Error('outside site');
  let file=resolve(root,path.slice(prefix.length));if(!file.startsWith(root+'/')&&file!==root)throw new Error('outside root');
  if((await stat(file)).isDirectory())file=resolve(file,'index.html');
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(await readFile(file));
 }catch{res.writeHead(404,{'Content-Type':'text/html'});res.end(await readFile(resolve(root,'404.html')));}
}).listen(4173,'0.0.0.0',()=>console.log('Static QA server :4173'));
