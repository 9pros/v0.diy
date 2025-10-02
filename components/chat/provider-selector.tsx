"use client";

import { Check, ChevronDown, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProviderType } from "@/lib/providers/types";

interface Provider {
  id: ProviderType;
  name: string;
  description: string;
  requiresApiKey: boolean;
  defaultBaseUrl?: string;
}

interface ProviderSelectorProps {
  onProviderChange?: (provider: ProviderType, model?: string) => void;
}

export function ProviderSelector({ onProviderChange }: ProviderSelectorProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>("v0");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  // Settings
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  // Load providers and user preferences
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load providers
        const providersRes = await fetch("/api/providers");
        const providersData = await providersRes.json();
        setProviders(providersData.providers || []);

        // Load user preferences
        const prefsRes = await fetch("/api/user/preferences");
        if (prefsRes.ok) {
          const prefs = await prefsRes.json();
          setSelectedProvider(prefs.provider || "v0");
          setSelectedModel(prefs.modelName);

          if (prefs.providerConfig) {
            setApiKey(prefs.providerConfig.apiKey || "");
            setBaseUrl(prefs.providerConfig.baseUrl || "");
          }
        }
      } catch (error) {
        console.error("Failed to load provider data:", error);
      }
    };

    loadData();
  }, []);

  // Load models when provider changes
  useEffect(() => {
    const loadModels = async () => {
      if (!selectedProvider) {
        return;
      }

      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (baseUrl) {
          params.append("baseUrl", baseUrl);
        }
        if (apiKey) {
          params.append("apiKey", apiKey);
        }

        const res = await fetch(
          `/api/providers/${selectedProvider}/models?${params}`,
        );
        const data = await res.json();
        setModels(data.models?.map((m: { name: string }) => m.name) || []);
      } catch (error) {
        console.error("Failed to load models:", error);
        setModels([]);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, [selectedProvider, baseUrl, apiKey]);

  const handleProviderSelect = async (providerId: ProviderType) => {
    setSelectedProvider(providerId);
    setSelectedModel(null);

    // Save preference
    try {
      await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerId,
          providerConfig: {
            baseUrl: baseUrl || undefined,
            apiKey: apiKey || undefined,
          },
        }),
      });
    } catch (error) {
      console.error("Failed to save preference:", error);
    }

    onProviderChange?.(providerId);
  };

  const handleModelSelect = async (model: string) => {
    setSelectedModel(model);

    // Save preference
    try {
      await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          modelName: model,
          providerConfig: {
            baseUrl: baseUrl || undefined,
            apiKey: apiKey || undefined,
          },
        }),
      });
    } catch (error) {
      console.error("Failed to save preference:", error);
    }

    onProviderChange?.(selectedProvider, model);
  };

  const handleSettingsSave = async () => {
    try {
      await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          modelName: selectedModel,
          providerConfig: {
            baseUrl: baseUrl || undefined,
            apiKey: apiKey || undefined,
          },
        }),
      });
      setShowSettings(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const currentProvider = providers.find((p) => p.id === selectedProvider);

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
              {currentProvider?.name || "Select Provider"}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>AI Provider</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {providers.map((provider) => (
              <DropdownMenuItem
                key={provider.id}
                onClick={() => handleProviderSelect(provider.id)}
                className="flex items-start gap-2"
              >
                <div className="flex h-5 items-center">
                  {selectedProvider === provider.id && (
                    <Check className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{provider.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {provider.description}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {models.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                {selectedModel || "Select Model"}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Model</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loading ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Loading...
                </div>
              ) : (
                models.map((model) => (
                  <DropdownMenuItem
                    key={model}
                    onClick={() => handleModelSelect(model)}
                    className="flex items-center gap-2"
                  >
                    <div className="flex h-5 items-center">
                      {selectedModel === model && <Check className="h-4 w-4" />}
                    </div>
                    <span className="text-xs">{model}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setShowSettings(true)}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provider Settings</DialogTitle>
            <DialogDescription>
              Configure your {currentProvider?.name} connection settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {currentProvider?.requiresApiKey && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL (optional)</Label>
              <Input
                id="baseUrl"
                type="url"
                placeholder={currentProvider?.defaultBaseUrl || "Default URL"}
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              {currentProvider?.defaultBaseUrl && (
                <p className="text-xs text-muted-foreground">
                  Default: {currentProvider.defaultBaseUrl}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSettingsSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
