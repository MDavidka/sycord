// pages/servers/index.tsx
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import type { User, ServerConfig, DiscordGuild } from '@/types'; // Your types

// Initialize Eruda debug console only in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  import('eruda').then((eruda) => eruda.default.init());
}

interface Props {
  initialServers: DiscordGuild[];
  user: User;
}

export default function ServerDashboard({ initialServers, user }: Props) {
  const [servers, setServers] = useState<DiscordGuild[]>(initialServers || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<ServerConfig | null>(null);

  useEffect(() => {
    // Load server config if needed
    if (selectedServer) return;
    
    const loadServerConfig = async (serverId: string) => {
      try {
        setLoading(true);
        const res = await fetch(`/api/servers/${serverId}/config`);
        const data = await res.json();
        setSelectedServer(data);
      } catch (err) {
        setError('Failed to load server config');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (servers.length > 0) {
      loadServerConfig(servers[0].id);
    }
  }, [servers]);

  const handleServerSelect = (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (server) {
      setSelectedServer(null); // Reset while loading
      fetch(`/api/servers/${serverId}/config`)
        .then(res => res.json())
        .then(setSelectedServer)
        .catch(console.error);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded">
        Error: {error}
        <button onClick={() => setError(null)} className="ml-4 px-3 py-1 bg-red-200 rounded">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Server Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Server List */}
        <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-4">Your Servers</h2>
          {loading && !servers.length ? (
            <div>Loading servers...</div>
          ) : (
            <ul className="space-y-2">
              {servers?.map(server => (
                <li 
                  key={server.id}
                  onClick={() => handleServerSelect(server.id)}
                  className={`p-2 rounded cursor-pointer hover:bg-gray-200 ${
                    selectedServer?.serverId === server.id ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="flex items-center">
                    {server.icon && (
                      <img 
                        src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`} 
                        alt={server.name}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                    )}
                    <span>{server.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Server Config */}
        <div className="md:col-span-3">
          {loading && !selectedServer ? (
            <div>Loading server configuration...</div>
          ) : selectedServer ? (
            <ServerConfigEditor 
              config={selectedServer} 
              onSave={(updatedConfig) => {
                // Implement save logic
                console.log('Saving config:', updatedConfig);
              }}
            />
          ) : (
            <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800">
              No server selected or configuration available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Server Config Editor Component
function ServerConfigEditor({ config, onSave }: { 
  config: ServerConfig; 
  onSave: (config: ServerConfig) => void 
}) {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">{config.serverName} Configuration</h2>
      {/* Implement your config editor here */}
      <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
        {JSON.stringify(localConfig, null, 2)}
      </pre>
      <button 
        onClick={() => onSave(localConfig)}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Save Changes
      </button>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  try {
    // Fetch user's servers from your API
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/users/${session.user.id}/servers`, {
      headers: {
        cookie: context.req.headers.cookie || '',
      },
    });

    if (!res.ok) throw new Error('Failed to fetch servers');

    const servers = await res.json();

    return {
      props: {
        initialServers: Array.isArray(servers) ? servers : [],
        user: session.user,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        initialServers: [],
        user: session.user,
      },
    };
  }
};