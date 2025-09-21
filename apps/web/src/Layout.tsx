import React from 'react';
import Header from './components/Header';

const Layout: React.FC<{ children: React.ReactNode }> = ({children}) => {
    return (
        <div className="flex flex-col w-[100vw] ">
            <Header />  
            {children}
        </div>
    );
};

export default Layout;