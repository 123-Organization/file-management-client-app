import React from 'react'
import Gallary from '../components/Gallary'
import { useDynamicData } from '../context/DynamicDataProvider';

const Thumbnail: React.FC = (): JSX.Element => {

  const dynamicData: any = useDynamicData();
  const { fileLocation, userInfo } = dynamicData.state;

  const libraryMeta: Record<string, { label: string; icon: JSX.Element; desc: string }> = {
    temporary: {
      label: 'Temporary',
      desc: 'Recently uploaded files',
      icon: (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 7C3 5.9 3.9 5 5 5H9L11 7H19C20.1 7 21 7.9 21 9V17C21 18.1 20.1 19 19 19H5C3.9 19 3 18.1 3 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    inventory: {
      label: 'Inventory',
      desc: 'Your permanent file library',
      icon: (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 3H8L6 7H18L16 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  };

  const handleLibrarySelect = (libraryName: string) => {
    const fileLocationObj = { selected: libraryName };
    const isUpdated = JSON.stringify(fileLocation) !== JSON.stringify(fileLocationObj);
    if (isUpdated) dynamicData.mutations.setFileLocationData(fileLocationObj);

    const userInfoObj = { ...userInfo, libraryName };
    const isUpdatedUser = JSON.stringify(userInfo) !== JSON.stringify(userInfoObj);
    if (isUpdatedUser) {
      userInfoObj.filterPageNumber = "1";
      dynamicData.mutations.setUserInfoData(userInfoObj);
    }
  };

  const availableLibraries = ['temporary', 'inventory'].filter(lib =>
    userInfo.libraryOptions.includes(lib)
  );

  return (
    <div className='relative'>
      <style>{`
        .sidebar-container {
          position: fixed;
          top: 64px;
          right: 0;
          bottom: 52px;
          width: inherit;
          background: #ffffff;
          border-left: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .sidebar-top {
          padding: 12px 14px 10px;
          border-bottom: 1px solid #f0f0f0;
          flex-shrink: 0;
        }
        .sidebar-top-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: #9ca3af;
        }
        .sidebar-list {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .lib-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 9px;
          cursor: pointer;
          transition: background 0.15s ease, box-shadow 0.12s ease;
          color: #4b5563;
          border: 1px solid transparent;
          user-select: none;
        }
        .lib-card:hover {
          background: #f3f4f6;
          color: #111827;
        }
        .lib-card.active {
          background: #f3f4f6;
          border-color: #e5e7eb;
          color: #111827;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .lib-card-icon {
          width: 30px;
          height: 30px;
          border-radius: 7px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #6b7280;
          transition: background 0.15s, color 0.15s;
        }
        .lib-card.active .lib-card-icon {
          background: #111827;
          border-color: #111827;
          color: #ffffff;
        }
        .lib-card-text {
          flex: 1;
          min-width: 0;
        }
        .lib-card-title {
          font-size: 13px;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lib-card-desc {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lib-card.active .lib-card-desc {
          color: #6b7280;
        }
        .lib-card-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #1f2937;
          flex-shrink: 0;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .lib-card.active .lib-card-dot {
          opacity: 1;
        }
        .sidebar-bottom {
          padding: 10px 14px;
          border-top: 1px solid #f0f0f0;
          flex-shrink: 0;
          font-size: 11px;
          color: #9ca3af;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>

      <div className='flex'>
        <div className={`${availableLibraries.length > 0 ? 'w-10/12' : 'w-full'} max-xl:w-9/12 max-md:w-full max-md:mt-40`}>
          <Gallary />
        </div>

        {availableLibraries.length > 0 && (
          <div className='sidebar-container md:w-2/12 max-md:hidden max-md:w-0'>
            <div className="sidebar-top">
              <div className="sidebar-top-label">Libraries</div>
            </div>

            <div className="sidebar-list">
              {availableLibraries.map(lib => {
                const meta = libraryMeta[lib];
                const isActive = fileLocation.selected === lib;
                return (
                  <div
                    key={lib}
                    className={`lib-card${isActive ? ' active' : ''}`}
                    onClick={() => handleLibrarySelect(lib)}
                  >
                    <div className="lib-card-icon">
                      {meta.icon}
                    </div>
                    <div className="lib-card-text">
                      <div className="lib-card-title">{meta.label}</div>
                      <div className="lib-card-desc">{meta.desc}</div>
                    </div>
                    <div className="lib-card-dot" />
                  </div>
                );
              })}
            </div>

            <div className="sidebar-bottom">
              <svg width="11" height="11" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
              </svg>
              {fileLocation.selected
                ? `Viewing: ${libraryMeta[fileLocation.selected]?.label ?? fileLocation.selected}`
                : 'Select a library'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Thumbnail
