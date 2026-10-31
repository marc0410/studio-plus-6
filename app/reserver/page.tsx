import type {Metadata} from 'next';import {BookingWizard} from '@/components/BookingWizard';
export const metadata:Metadata={title:'Réserver le studio'};
export default async function Reserver({searchParams}:{searchParams:Promise<{service?:string;date?:string;time?:string}>}){const {service='podcast',date='',time=''}=await searchParams;return <BookingWizard initialService={service} initialDate={date} initialTime={time}/>}
