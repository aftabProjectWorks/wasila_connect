diff --git a/services/cards.ts b/services/cards.ts
index 6288472..0000000 100644
--- a/services/cards.ts
+++ b/services/cards.ts
@@
- export async function useCardSticks(
+ export async function applyCardSticks(
   cardId: string,
   quantity: number,
   bufferPercent: number = 70,
   redPercent: number = 90,
   actorId?: string
 ): Promise<ApiResponse<Card>> {
@@
     const { data, error } = await db
       .from('cards')
       .update({
         sticks_used: newSticksUsed,
         risk_state: newRiskState,
         updated_at: new Date().toISOString(),
       })
       .eq('id', cardId)
       .select()
       .single();
@@
     await auditLog(db, actorId || null, 'update', 'card', cardId, before, data, {
       action: 'sticks_used',
       quantity,
       new_risk_state: newRiskState,
     });
 
     return { success: true, data };
   } catch (err) {
     return { success: false, error: String(err) };
   }
 }
