'use client';import {usePathname} from 'next/navigation';import {SiteFooter,SiteHeader} from '@/components/SiteShell';
export function SiteChrome({children}:{children:React.ReactNode}){const path=usePathname();const bare=path.startsWith('/espace')||path.startsWith('/connexion')||path.startsWith('/deconnexion');return <>{!bare&&<SiteHeader/>}{children}{!bare&&<SiteFooter/>}</>}
