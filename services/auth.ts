*** Begin Patch
*** Update File: services/auth.ts
@@
-export default { createOrGetMemberFromAuth, getMemberBySupabaseId, getMemberById, isAdminFromAccessToken, isMemberAdmin };
+const authService = { createOrGetMemberFromAuth, getMemberBySupabaseId, getMemberById, isAdminFromAccessToken, isMemberAdmin };
+export default authService;
*** End Patch
