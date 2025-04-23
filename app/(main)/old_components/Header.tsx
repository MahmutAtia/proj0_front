'use client';
import React, { useContext, useRef, useState } from 'react';
import Link from 'next/link';
import { StyleClass } from 'primereact/styleclass';
import { Button } from 'primereact/button';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { NodeRef } from '@/types';
import { classNames } from 'primereact/utils';

const Header = () => {
    const [isHidden, setIsHidden] = useState(false);
    const { layoutConfig } = useContext(LayoutContext);
    const menuRef = useRef<HTMLElement | null>(null);

    const toggleMenuItemClick = () => {
        setIsHidden((prevState) => !prevState);
    };

    return (
        <div className="py-4 px-4 mx-0 md:mx-6 lg:mx-8 lg:px-8 flex align-items-center justify-content-between relative lg:static">
            <Link href="/" className="flex align-items-center">
                <img src={`/layout/images/${layoutConfig.colorScheme === 'light' ? 'logo-dark' : 'logo-white'}.svg`} alt="Sakai Logo" height="50" className="mr-0 lg:mr-2" />
                <span className="text-900 font-medium text-2xl line-height-3 mr-8">SAKAI</span>
            </Link>
            <StyleClass nodeRef={menuRef as NodeRef} selector="@next" enterClassName="hidden" leaveToClassName="hidden" hideOnOutsideClick>
                <i ref={menuRef} className="pi pi-bars text-4xl cursor-pointer block lg:hidden text-700"></i>
            </StyleClass>
            <div className={classNames('align-items-center surface-0 flex-grow-1 justify-content-between hidden lg:flex absolute lg:static w-full left-0 px-6 lg:px-0 z-2', { hidden: isHidden })} style={{ top: '100%' }}>
                <ul className="list-none p-0 m-0 flex lg:align-items-center select-none flex-column lg:flex-row cursor-pointer">
                    <li>
                        <a href="#home" onClick={toggleMenuItemClick} className="p-ripple flex m-0 md:ml-5 px-0 py-3 text-900 font-medium line-height-3">
                            <span>Home</span>
                        </a>
                    </li>
                    <li>
                        <a href="#features" onClick={toggleMenuItemClick} className="p-ripple flex m-0 md:ml-5 px-0 py-3 text-900 font-medium line-height-3">
                            <span>Features</span>
                        </a>
                    </li>
                    <li>
                        <a href="#highlights" onClick={toggleMenuItemClick} className="p-ripple flex m-0 md:ml-5 px-0 py-3 text-900 font-medium line-height-3">
                            <span>Highlights</span>
                        </a>
                    </li>
                    <li>
                        <a href="#pricing" onClick={toggleMenuItemClick} className="p-ripple flex m-0 md:ml-5 px-0 py-3 text-900 font-medium line-height-3">
                            <span>Pricing</span>
                        </a>
                    </li>
                </ul>
                <div className="flex justify-content-between lg:block border-top-1 lg:border-top-none surface-border py-3 lg:py-0 mt-3 lg:mt-0">
                    <Button label="Login" text rounded className="border-none font-light line-height-2 text-blue-500"></Button>
                    <Button label="Register" rounded className="border-none ml-5 font-light line-height-2 bg-blue-500 text-white"></Button>
                </div>
            </div>
        </div>
    );
};

export default Header;
