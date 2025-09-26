import React from 'react';
import { Logo, AppLogo } from './index.jsx';

const LogoDemo = () => {
  return (
    <div className="p-8 space-y-8 bg-background-primary">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Logo Showcase</h1>
        <p className="text-text-secondary">App logos in various sizes and variants</p>
      </div>

      {/* New AppLogo Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-text-primary">New App Logo (Minimalist Face)</h2>
        <div className="flex items-center space-x-6 p-6 bg-background-secondary rounded-xl">
          <div className="text-center">
            <AppLogo size={20} variant="minimal" />
            <p className="text-sm text-text-muted mt-2">20px</p>
          </div>
          <div className="text-center">
            <AppLogo size={32} variant="minimal" />
            <p className="text-sm text-text-muted mt-2">32px</p>
          </div>
          <div className="text-center">
            <AppLogo size={48} variant="minimal" />
            <p className="text-sm text-text-muted mt-2">48px</p>
          </div>
          <div className="text-center">
            <AppLogo size={64} variant="minimal" />
            <p className="text-sm text-text-muted mt-2">64px</p>
          </div>
        </div>
        
        {/* AppLogo Variants */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 bg-background-secondary rounded-xl text-center">
            <AppLogo size={48} variant="default" />
            <p className="text-sm text-text-muted mt-2">Default (Light)</p>
          </div>
          <div className="p-6 bg-background-secondary rounded-xl text-center">
            <AppLogo size={48} variant="minimal" />
            <p className="text-sm text-text-muted mt-2">Minimal (Blue)</p>
          </div>
          <div className="p-6 bg-background-secondary rounded-xl text-center">
            <AppLogo size={48} variant="white" />
            <p className="text-sm text-text-muted mt-2">White</p>
          </div>
          <div className="p-6 bg-background-secondary rounded-xl text-center">
            <AppLogo size={48} variant="black" />
            <p className="text-sm text-text-muted mt-2">Black</p>
          </div>
        </div>
      </div>

      {/* Size Variations */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-text-primary">Size Variations</h2>
        <div className="flex items-center space-x-6 p-6 bg-background-secondary rounded-xl">
          <div className="text-center">
            <Logo size="xs" />
            <p className="text-sm text-text-muted mt-2">XS</p>
          </div>
          <div className="text-center">
            <Logo size="sm" />
            <p className="text-sm text-text-muted mt-2">SM</p>
          </div>
          <div className="text-center">
            <Logo size="md" />
            <p className="text-sm text-text-muted mt-2">MD</p>
          </div>
          <div className="text-center">
            <Logo size="lg" />
            <p className="text-sm text-text-muted mt-2">LG</p>
          </div>
          <div className="text-center">
            <Logo size="xl" />
            <p className="text-sm text-text-muted mt-2">XL</p>
          </div>
          <div className="text-center">
            <Logo size="2xl" />
            <p className="text-sm text-text-muted mt-2">2XL</p>
          </div>
        </div>
      </div>

      {/* Color Variations */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-text-primary">Color Variations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-background-secondary rounded-xl text-center">
            <Logo size="lg" variant="default" />
            <p className="text-sm text-text-muted mt-2">Default (White)</p>
          </div>
          <div className="p-6 bg-background-secondary rounded-xl text-center">
            <Logo size="lg" variant="primary" />
            <p className="text-sm text-text-muted mt-2">Primary (Blue)</p>
          </div>
          <div className="p-6 bg-background-secondary rounded-xl text-center">
            <Logo size="lg" variant="muted" />
            <p className="text-sm text-text-muted mt-2">Muted (Gray)</p>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-text-primary">Usage Examples</h2>
        
        {/* Header Example */}
        <div className="p-4 bg-background-secondary rounded-xl">
          <div className="flex items-center space-x-3">
            <AppLogo size={32} variant="minimal" />
            <h3 className="text-lg font-semibold text-text-primary">Untangle</h3>
          </div>
        </div>

        {/* Sidebar Example */}
        <div className="p-4 bg-background-secondary rounded-xl">
          <div className="flex items-center space-x-2">
            <AppLogo size={32} variant="minimal" />
            <span className="text-xl font-bold tracking-wide text-text-primary">Untangle</span>
          </div>
        </div>

        {/* Footer Example */}
        <div className="p-4 bg-background-secondary rounded-xl">
          <div className="flex items-center justify-center space-x-2">
            <Logo size="md" variant="muted" />
            <span className="text-sm text-text-muted">© 2024 Untangle. All rights reserved.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoDemo;
