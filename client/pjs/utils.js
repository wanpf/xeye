((
  platform = (os.platform === 'windows') ? 0 : (
    (os.platform === 'linux') ? 1 : 2
  ),

  winExec = cmd => (
    new Data(pipy.exec(cmd)?.toArray?.()?.filter?.(c => c < 0x80) || '').toString()
  ),

  unixExec = cmd => (
    pipy.exec(cmd)?.toString?.() || ''
  ),

  pipyExec = platform === 0 ? winExec : unixExec,

  mac = (
    platform === 0 ? (
      (pipyExec('getmac')?.split('\n')?.filter(e => e.toUpperCase().includes('TCPIP') && !e.toUpperCase().includes('N/A'))?.[0]?.split?.(' ')?.[0] || algo.uuid()).toUpperCase()
    ) : (
      (pipyExec('ifconfig')?.split('\n')?.filter(e => e.includes('ether'))?.[0]?.split?.('ether')?.[1]?.split?.(' ')?.[1] || algo.uuid()).toUpperCase()
    )
  ),

  hostname = pipyExec('hostname').replace('\n', '').replace('\r', ''),

  id = mac + '_' + hostname,

  sysinfo = platform === 0 ? (
    (
      get = str => str?.substring?.(str.indexOf(':') + 1)?.trim?.() || '',
      si = pipyExec('systeminfo').replaceAll('\r', '').split('\n').filter(s => s.includes(':')),
    ) => (
      {
        hostname: get(si[0]),
        osName: get(si[1]),
        osVersion: get(si[2]),
        lastBootUptime: get(si[10]),
        cpuInfo: get(si[15]),
        ipAddress: pipyExec('netsh interface ip show address').replaceAll('\r', '').split('\n').filter(s => s.includes(':') && s.includes('IP')).map(s => get(s.split(':')[1])).filter(e => e != '127.0.0.1').join(','),
        mac
      }
    )
  )() : (
    {
      hostname: pipyExec('hostname').replace('\n', ''),
      osName: pipyExec('uname').replace('\n', ''),
      osVersion: pipyExec('uname -v').replace('\n', ''),
      lastBootUptime: platform === 1 ? pipyExec('uptime -s').replace('\n', '') : pipyExec('uptime').replace('\n', ''),
      cpuInfo: pipyExec('lscpu').split('\n').filter(e => e.includes('Model name')).map(e => e.split(':')[1].trim())[0] || 'unknown',
      ipAddress: platform === 1 ? pipyExec('hostname -I')?.replaceAll?.(' ', ',').replace(',\n', '') : pipyExec('ifconfig').split('\n').filter(e => e.includes('inet ') && e.includes('cast')).map(e => e.split(' ')[1].trim()).join(','),
      mac
    }
  ),

  directorySeparatorChar = (platform === 0 ? '\\' : '/'),

  rollbackMtime = (
    (
      stat = os.stat('..' + directorySeparatorChar + 'pjs_rollback' + directorySeparatorChar),
    ) => (
      (__thread.id === 0) && stat?.isDirectory?.() ? (
        console.log('=== pjs_rollback stat ===', stat),
        stat.mtime
      ) : (
        undefined
      )
    )
  )(),

  checkRollback = () => (
    rollbackMtime && (Date.now() / 1000 - rollbackMtime > 90) && (
      console.log('===== roll back ====='),
      platform === 0 ? (
        pipyExec(['robocopy', '..' + directorySeparatorChar + 'pjs_rollback' + directorySeparatorChar, '.', '/s', '/e'])
      ) : (
        pipyExec(['sh', '-c', 'cp -rf ..' + directorySeparatorChar + 'pjs_rollback' + directorySeparatorChar + '* .'])
      )
    )
  ),

) => (

  checkRollback(),

  {
    platform,
    pipyExec,
    mac,
    hostname,
    id,
    sysinfo,
    directorySeparatorChar,
    global: { alive: false, rollbackMtime }
  }
)

)()
