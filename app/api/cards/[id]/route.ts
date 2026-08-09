import { NextRequest, NextResponse } from 'next/server';
-import { getCard, useCardSticks, completeCard, quitCard } from '@/services/cards';
+import { getCard, applyCardSticks, completeCard, quitCard } from '@/services/cards';
 
 interface Params { params: { id: string } }
@@
     if (action === 'use') {
       const qty = Number(body?.quantity || 0);
-      const res = await useCardSticks(params.id, qty, body?.bufferPercent, body?.redPercent, body?.actor_id);
+      const res = await applyCardSticks(params.id, qty, body?.bufferPercent, body?.redPercent, body?.actor_id);
       if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
       return NextResponse.json({ success: true, data: res.data });
     }
