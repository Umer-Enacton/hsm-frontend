"use client";

import { useEffect, useState } from "react";
import {
  getTokenFromStorage,
  parseToken,
  getUserData,
  isAuthenticated,
} from "@/lib/auth-utils";

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const token = getTokenFromStorage();
    const parsed = token ? parseToken(token) : null;
    const userData = getUserData();
    const authenticated = isAuthenticated();

    setDebugInfo({
      token: token ? `${token.substring(0, 20)}...` : null,
      tokenLength: token?.length || 0,
      parsedToken: parsed,
      userData: userData,
      isAuthenticated: authenticated,
      localStorage: {
        token: localStorage.getItem("token"),
        userData: localStorage.getItem("userData"),
      },
      sessionStorage: {
        token: sessionStorage.getItem("token"),
        userData: sessionStorage.getItem("userData"),
      },
    });
  }, []);

  if (!debugInfo) {
    return <div className="p-8">Loading debug info...</div>;
  }

  return (
    <div className="p-8 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Authentication Debug Info</h1>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Is Authenticated:</h2>
        <pre className="text-sm">
          {JSON.stringify(debugInfo.isAuthenticated, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Token (truncated):</h2>
        <pre className="text-sm">{debugInfo.token}</pre>
        <p className="text-sm text-gray-600">Length: {debugInfo.tokenLength}</p>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Parsed Token:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(debugInfo.parsedToken, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">User Data (from getUserData):</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(debugInfo.userData, null, 2)}
        </pre>
      </div>

      <div className="bg-blue-100 p-4 rounded">
        <h2 className="font-bold mb-2">LocalStorage:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(debugInfo.localStorage, null, 2)}
        </pre>
      </div>

      <div className="bg-green-100 p-4 rounded">
        <h2 className="font-bold mb-2">SessionStorage:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(debugInfo.sessionStorage, null, 2)}
        </pre>
      </div>

      <div className="bg-yellow-100 p-4 rounded">
        <h2 className="font-bold mb-2">Cookies (document.cookie):</h2>
        <pre className="text-sm overflow-auto break-all">{document.cookie}</pre>
      </div>
    </div>
  );
}
