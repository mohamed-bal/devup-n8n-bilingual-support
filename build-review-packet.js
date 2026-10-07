function supportCore() {
  function review(result) {
    const { context, triage, lookup } = result;
    const reasons = [];
    let queue = 'support';
    let priority = 'standard';
    if (!result.triageValid) { reasons.push(result.validationReason); queue = 'manual_review'; }
    else {
      if (triage.requests_refund || triage.intent === 'refund') {
        reasons.push('refund_request'); queue = 'refund_review'; priority = 'high';
      }
      if (triage.intent === 'payment_issue' && queue === 'support') queue = 'billing_review';
      if (lookup.status !== 'verified') reasons.push(lookup.status);
      if (lookup.status === 'verified' && triage.claims_paid && lookup.order.paymentStatus !== 'confirmed') {
        reasons.push('payment_claim_conflict');
        if (queue !== 'refund_review') queue = 'billing_review';
        priority = 'high';
      }
    }
    const ar = context.replyLocale === 'ar';
    let draft;
    if (lookup.status === 'verified') {
      const o = lookup.order;
      const paid = o.paymentStatus === 'confirmed';
      const dispatched = o.shippingStatus === 'dispatched';
      draft = ar
        ? `مرحباً. بحسب السجل المتاح للطلب ${o.orderId}، ${paid ? 'الدفع مسجّل كمؤكّد' : 'الدفع غير مسجّل كمؤكّد بعد'}، و${dispatched ? 'الشحنة مسجّلة كمُرسلة' : 'الشحنة غير مسجّلة كمُرسلة بعد'}. هذه الحالة تعكس آخر تحديث متاح للسجل.`
        : `Bonjour. Selon le dernier état disponible de la commande ${o.orderId}, le paiement ${paid ? 'est enregistré comme confirmé' : "n'est pas encore enregistré comme confirmé"} et l'expédition ${dispatched ? 'est enregistrée comme effectuée' : "n'est pas encore enregistrée comme effectuée"}. Cet état correspond à la dernière mise à jour disponible du dossier.`;
      if (reasons.includes('payment_claim_conflict')) draft += ar
        ? ' بما أنكم تشيرون إلى إتمام الدفع، يلزم التحقق من هذا التعارض قبل تأكيد الحالة.'
        : ' Puisque vous indiquez avoir payé, cet écart doit être vérifié avant de confirmer la situation.';
      if (queue === 'refund_review') draft += ar
        ? ' طلب الاسترجاع يحتاج إلى مراجعة الفريق؛ لم يتم تنفيذ استرجاع.'
        : "La demande de remboursement doit être examinée par l'équipe ; aucun remboursement n'a été effectué.";
    } else if (result.triageValid && triage.intent === 'other' &&
      !triage.requests_refund && lookup.status === 'missing_order_id') {
      draft = ar ? 'مرحباً. تم إعداد الاستفسار لمراجعة فريق الدعم قبل تقديم الرد.'
        : "Bonjour. Votre demande a été préparée pour examen par l'équipe de support avant toute réponse.";
    } else if (lookup.status === 'missing_order_id' || lookup.status === 'ambiguous_order_id') {
      draft = ar ? 'مرحباً. يرجى تحديد رقم طلب واحد حتى نتمكن من متابعة الاستفسار.'
        : 'Bonjour. Merci de préciser un seul numéro de commande pour que nous puissions examiner votre demande.';
    } else {
      draft = ar ? 'مرحباً. تعذّر التحقق من حالة الطلب في هذه المعالجة. يلزم أن يراجع الفريق الاستفسار قبل تقديم تأكيد.'
        : "Bonjour. Le statut de la commande n'a pas pu être vérifié dans ce traitement. Votre demande doit être examinée avant toute confirmation.";
    }
    return {
      messageId: context.messageId, source: context.source,
      tenantId: context.tenantId, customerId: context.customerId,
      originalMessage: context.text, replyLocale: context.replyLocale,
      triage: result.triageValid ? triage : null,
      verification: lookup.status,
      evidence: lookup.status === 'verified' ? [lookup.order] : [],
      queue, priority, reviewReasons: reasons,
      proposedReply: draft,
      requiresHumanApproval: true, deliveryStatus: 'not_sent',
      apiRequestId: result.requestId,
      demoData: true,
    };
  }

  return { review };
}
return { json: supportCore().review($json) };
