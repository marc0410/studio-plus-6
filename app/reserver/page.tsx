import type {Metadata} from 'next';import {BookingWizard} from '@/components/BookingWizard';
export const metadata:Metadata={title:'Réserver le studio'};
export default async function Reserver({searchParams}:{searchParams:Promise<{service?:string;date?:string;time?:string;formule?:string;decor?:string;intervenants?:string}>}){const {service='podcast',date='',time='',formule='',decor='',intervenants=''}=await searchParams;return <BookingWizard initialService={service} initialDate={date} initialTime={time} initialFormula={formule} initialDecor={decor} initialParticipants={intervenants}/>}
