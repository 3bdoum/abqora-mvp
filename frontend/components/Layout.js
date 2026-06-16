import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from "next/image";
import { withBasePath } from '../utils/paths';

export default function Layout({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const name = localStorage.getItem('userName');
            const role = localStorage.getItem('userRole');
            setUser({ name, role });
        }
    }, []);

    const logout = () => {
        localStorage.clear();
        window.location.href = withBasePath('/login');
    };

    const getRoleLabel = (role) => {
        if (role === 'admin') return 'معلم';
        if (role === 'parent') return 'ولي أمر';
        return 'طالب';
    };

    return (
        <div className="rtl layout">
            <header className="topbar">

                {/* LOGO */}
                <div>
                    <Link href="/dashboard" className="topbar-logo flex items-center gap-2">
                        <Image
                            src={withBasePath('/images/avatar.png')}
                            alt="Abqora Avatar"
                            width={60}
                            height={60}
                            className="rounded-full"
                        />
                        <span>عبقورا 🎓</span>
                    </Link>
                </div>

                {/* ACTIONS */}
                <div className="topbar-actions">
                    {user && (
                        <>
                            <span className="user-badge">
                                {getRoleLabel(user.role)}: {user.name}
                            </span>

                            {user.role === 'parent' && (
                                <Link
                                    href="/parent/dashboard"
                                    className="small-button secondary"
                                    style={{ textDecoration: 'none' }}
                                >
                                    لوحة المتابعة
                                </Link>
                            )}

                            {user.role === 'admin' && (
                                <Link
                                    href="/admin"
                                    className="small-button secondary"
                                    style={{ textDecoration: 'none' }}
                                >
                                    لوحة الإدارة
                                </Link>
                            )}
                        </>
                    )}

                    <button
                        className="small-button"
                        onClick={logout}
                        style={{ backgroundColor: 'var(--danger)', color: 'white' }}
                    >
                        خروج
                    </button>
                </div>

            </header>

            <main>{children}</main>
        </div>
    );
}
