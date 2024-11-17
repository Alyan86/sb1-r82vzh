  import React, { useState } from 'react';

  interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    parents?: string[];
  }

  interface DriveData {
    files: DriveFile[];
  }

  interface DriveStructureProps {
    driveData: DriveData;
    onSelect: (selectedItems: { id: string; path: string; name: string; type: 'folder' | 'file'; }[]) => void;
  }

  interface FileItem {
    id: string;
    name: string;
    path: string;
    type: 'folder' | 'file';
    children?: FileItem[];
  }

  export const DriveStructure = ({ driveData, onSelect }: DriveStructureProps) => {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [allSelectedItems, setAllSelectedItems] = useState<{ id: string; path: string; name: string; type: 'folder' | 'file'; }[]>([]);

    const buildFileTree = (files: DriveFile[]): FileItem[] => {
      const rootItems: FileItem[] = [];
      const itemMap: { [key: string]: FileItem } = {};

      files.forEach(file => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        const newItem: FileItem = {
          id: file.id,
          name: file.name,
          path: '',
          type: isFolder ? 'folder' : 'file',
          children: isFolder ? [] : undefined,
        };
        itemMap[file.id] = newItem;
      });

      files.forEach(file => {
        const item = itemMap[file.id];
        if (file.parents && file.parents.length > 0) {
          const parentId = file.parents[0];
          const parentItem = itemMap[parentId];
          if (parentItem) {
            parentItem.children!.push(item);
          } else {
            rootItems.push(item);
          }
        } else {
          rootItems.push(item);
        }
      });

      const setPaths = (items: FileItem[], parentPath: string) => {
        items.forEach(item => {
          item.path = `${parentPath}/${item.name}`;
          if (item.children) {
            setPaths(item.children, item.path);
          }
        });
      };

      setPaths(rootItems, '');

      const sortItems = (items: FileItem[]) => {
        items.sort((a, b) => a.name.localeCompare(b.name));
        items.sort((a, b) => (a.type === 'folder' && b.type === 'file' ? -1 : a.type === 'file' && b.type === 'folder' ? 1 : 0));
        items.forEach(item => {
          if (item.children) {
            sortItems(item.children);
          }
        });
      };

      sortItems(rootItems);
      return rootItems;
    };

    const fileTree = buildFileTree(driveData.files);

    const handleToggleFolder = (id: string) => {
      const newExpandedFolders = new Set(expandedFolders);
      if (newExpandedFolders.has(id)) {
        newExpandedFolders.delete(id);
      } else {
        newExpandedFolders.add(id);
      }
      setExpandedFolders(newExpandedFolders);
    };

    const handleSelectItem = (item: FileItem) => {
      const newSelectedItems = new Set(selectedItems);
      const toggleSelection = (fileItem: FileItem, isSelected: boolean) => {
        if (isSelected) {
          newSelectedItems.add(fileItem.id);
          allSelectedItems.push({ id: fileItem.id, path: fileItem.path, name: fileItem.name, type: fileItem.type });
        } else {
          newSelectedItems.delete(fileItem.id);
          const index = allSelectedItems.findIndex(selected => selected.id === fileItem.id);
          if (index > -1) {
            allSelectedItems.splice(index, 1);
          }
        }
        if (fileItem.children) {
          fileItem.children.forEach(child => toggleSelection(child, isSelected));
        }
      };
      const isSelected = !selectedItems.has(item.id);
      toggleSelection(item, isSelected);
      setSelectedItems(newSelectedItems);
      setAllSelectedItems([...allSelectedItems]);
    };

    const renderFileTree = (items: FileItem[]): JSX.Element[] => {
      return items.map(item => {
        const isSelected = selectedItems.has(item.id);
        const isExpanded = expandedFolders.has(item.id);
        return (
          <div key={item.id} className="pl-4 border-t border-gray-200 py-2">
            <div className={`flex items-center cursor-pointer ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
              {item.type === 'folder' ? (
                <>
                  <span onClick={() => handleToggleFolder(item.id)} className="mr-2">
                    {isExpanded ? <i className="fas fa-caret-down"></i> : <i className="fas fa-caret-right"></i>}
                  </span>
                  <span onClick={() => handleSelectItem(item)} className="mr-2">
                    <i className="fas fa-folder" style={{ color: 'orange' }}></i>
                  </span>
                </>
              ) : (
                <>
                  <span className="mr-2">
                    <i className="fas fa-file" style={{ color: 'blue' }}></i>
                  </span>
                </>
              )}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleSelectItem(item)}
                className="mr-2 cursor-pointer"
              />
              <span className="truncate max-w-[200px] font-semibold">{item.name}</span>
            </div>
            {isExpanded && item.children && renderFileTree(item.children)}
          </div>
        );
      });
    };

    const handleLogSelectedItems = () => {
      console.log(allSelectedItems);
    };

    return (
      <div className="bg-white text-black p-4 rounded-lg shadow-md">
        <div className="max-h-96 overflow-y-auto">
          {renderFileTree(fileTree)}
        </div>
        {selectedItems.size > 0 && (
          <button
            onClick={handleLogSelectedItems}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded transition duration-200 hover:bg-blue-600"
          >
            Log Selected Items
          </button>
        )}
      </div>
    );
  };
