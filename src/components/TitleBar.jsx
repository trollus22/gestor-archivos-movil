import React from 'react';
import { Home, Folder, Plus, X, Minus, Square } from 'lucide-react';

export default function TitleBar({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTab }) {
  return (
    <div className="h-10 bg-[#f3f4f6]/80 dark:bg-fluent-darkBg/90 backdrop-blur-md flex items-center justify-between px-3 border-b border-fluent-border select-none">
      {/* Pestañas funcionales */}
      <div className="flex items-center space-x-1 flex-1 overflow-x-auto no-scrollbar py-1">
        {/* Logo Files app */}
        <div className="flex items-center justify-center w-7 h-7 mr-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <div className="w-4 h-4 bg-fluent-blue rounded flex items-center justify-center text-white shadow-sm">
            <span className="text-[10px] font-bold">F</span>
          </div>
        </div>

        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center max-w-[200px] min-w-[120px] h-8 px-3 rounded-t-lg text-xs font-medium cursor-pointer transition-all border border-b-0 ${
                isActive
                  ? 'bg-white dark:bg-fluent-darkSurface text-fluent-text dark:text-fluent-darkText border-fluent-border shadow-sm'
                  : 'bg-transparent text-fluent-textSecondary dark:text-fluent-darkTextSecondary hover:bg-black/5 dark:hover:bg-white/5 border-transparent'
              }`}
            >
              <div className="mr-2 flex-shrink-0 text-fluent-blue">
                {tab.path === 'home' ? <Home size={14} /> : <Folder size={14} />}
              </div>
              <span className="truncate flex-1">{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className={`ml-1.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                title="Cerrar pestaña"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        {/* Botón nueva pestaña (+) */}
        <button
          onClick={onNewTab}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-fluent-textSecondary dark:text-fluent-darkTextSecondary transition-colors ml-1"
          title="Nueva pestaña"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Controles de ventana típicos de Windows 11 */}
      <div className="flex items-center space-x-2 text-fluent-textSecondary dark:text-fluent-darkTextSecondary">
        <button
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          title="Minimizar"
        >
          <Minus size={13} />
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          title="Maximizar"
        >
          <Square size={11} />
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-500 hover:text-white transition-colors"
          title="Cerrar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
