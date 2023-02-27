import fetch, { FormData, File } from 'node-fetch';
import type { NextApiRequest, NextApiResponse } from 'next';

interface Project {
  projectName: string;
  applets: Applet[];
  datas: {
    monitor: Monitor;
  }[];
  envs: string[][];
}

interface Applet {
  wasmURL: string;
  appletName: string;
}

interface Monitor {
  contractLog: {
    eventType: string;
    chainID: number;
    contractAddress: string;
    blockStart: number;
    blockEnd: number;
    topic0: string;
  };
  chainTx: {
    eventType: string;
    chainID: number;
    txAddress: string;
  };
  chainHeight: {
    eventType: string;
    chainID: number;
    height: number;
  };
}

let _token = '';
const getToken = async () => {
  if (_token) {
    return _token;
  } else {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/srv-applet-mgr/v0/login`, {
      method: 'put',
      body: JSON.stringify({
        username: 'admin',
        password: process.env.ADMIN_KEY
      })
    });
    const data: any = await response.json();
    _token = data.token;
    return _token;
  }
};

const createProject = async (
  project: Project
): Promise<{
  projectID: string;
  projectName: string;
}> => {
  const token = await getToken();
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/srv-applet-mgr/v0/project`, {
    method: 'post',
    body: JSON.stringify({
      name: project.projectName
    }),
    headers: { Authorization: token }
  });
  const data: any = await response.json();
  return {
    projectID: data.projectID,
    projectName: data.name
  };
};

const saveEnvs = async (projectName: string, envs: string[][]): Promise<void> => {
  const token = await getToken();
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/srv-applet-mgr/v0/project_config/${projectName}/PROJECT_ENV`, {
    method: 'post',
    body: JSON.stringify({
      env: envs
    }),
    headers: { Authorization: token }
  });
};

const createApplet = async ({ projectName, appletName, wasmURL }: Applet & { projectName: string }): Promise<string> => {
  const response = await fetch(wasmURL);
  const blob = await response.blob();
  const formData = new FormData();
  const wasmName = wasmURL.split('/').pop();
  const file = new File([blob], wasmName, { type: 'application/wasm' });
  formData.set('file', file, wasmName);
  formData.set(
    'info',
    JSON.stringify({
      projectName,
      appletName,
      wasmName
    })
  );
  const token = await getToken();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/srv-applet-mgr/v0/applet/${projectName}`, {
    method: 'post',
    headers: {
      Authorization: token
    },
    body: formData
  });
  const data: any = await res.json();
  return data.appletID;
};

const deployApplet = async (appletID: string): Promise<string> => {
  const token = await getToken();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/srv-applet-mgr/v0/deploy/applet/${appletID}`, {
    method: 'post',
    headers: {
      Authorization: token
    }
  });
  const data: any = await res.json();
  return data.instanceID;
};

const createMonitor = async (projectName: string, monitor: Monitor): Promise<void> => {
  const token = await getToken();
  if (monitor.contractLog) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/srv-applet-mgr/v0/monitor/contract_log/${projectName}`, {
      method: 'post',
      body: JSON.stringify({
        projectName,
        ...monitor.contractLog
      }),
      headers: { Authorization: token }
    });
  }

  if (monitor.chainTx) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/srv-applet-mgr/v0/monitor/chain_tx/${projectName}`, {
      method: 'post',
      body: JSON.stringify({
        projectName,
        ...monitor.chainTx
      }),
      headers: { Authorization: token }
    });
  }

  if (monitor.chainHeight) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/srv-applet-mgr/v0/monitor/chain_height/${projectName}`, {
      method: 'post',
      body: JSON.stringify({
        projectName,
        ...monitor.chainHeight
      }),
      headers: { Authorization: token }
    });
  }
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    method,
    query: { adminKey }
  } = req;
  if (method === 'POST') {
    if (adminKey !== process.env.ADMIN_KEY) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const project = req.body.project as Project[];
    if (!project) {
      res.status(400).json({ message: 'Bad Request' });
      return;
    }
    try {
      for (const p of project) {
        const { projectID, projectName } = await createProject(p);
        if (p.envs?.length > 0) {
          await saveEnvs(projectName, p.envs);
        }
        for (const a of p.applets) {
          const appletID = await createApplet({ ...a, projectName });
          const instanceID = await deployApplet(appletID);
        }
        for (const d of p.datas) {
          if (d.monitor) {
            await createMonitor(projectName, d.monitor);
          }
        }
      }
      res.status(200).json({ message: 'OK' });
    } catch (error) {
      res.status(500).send(error);
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
};

export default handler;