function supportCore() {
  // Fictional data: these are NOT DEVUP AI customer orders or policies.
  const orders = [
    { tenantId: 'demo-shop', customerId: 'customer-001', orderId: 'DZ-1042',
      paymentStatus: 'pending', shippingStatus: 'not_dispatched', ageMinutes: 5 },
    { tenantId: 'demo-shop', customerId: 'customer-001', orderId: 'DZ-1043',
      paymentStatus: 'confirmed', shippingStatus: 'dispatched', ageMinutes: 5 },
    { tenantId: 'demo-shop', customerId: 'customer-002', orderId: 'DZ-2042',
      paymentStatus: 'confirmed', shippingStatus: 'dispatched', ageMinutes: 5 },
    { tenantId: 'another-shop', customerId: 'customer-001', orderId: 'DZ-3042',
      paymentStatus: 'confirmed', shippingStatus: 'dispatched', ageMinutes: 5 },
    { tenantId: 'demo-shop', customerId: 'customer-001', orderId: 'DZ-1044',
      paymentStatus: 'confirmed', shippingStatus: 'dispatched', ageMinutes: 120 },
  ];
  function lookup(validated, options = {}) {
    const out = { ...validated, lookup: { status: 'skipped', order: null } };
    if (!validated.triageValid) return out;
    if (validated.orderIds.length > 1) {
      out.lookup.status = 'ambiguous_order_id'; return out;
    }
    const id = validated.triage.order_id;
    if (id === null) { out.lookup.status = 'missing_order_id'; return out; }
    if (options.unavailable === true) { out.lookup.status = 'unavailable'; return out; }
    const row = orders.find(o => o.tenantId === validated.context.tenantId &&
      o.customerId === validated.context.customerId && o.orderId === id);
    if (!row) { out.lookup.status = 'not_found_or_forbidden'; return out; }
    if (row.ageMinutes > 30) { out.lookup.status = 'stale'; return out; }
    const clock = options.now ? new Date(options.now) : new Date();
    const asOf = new Date(clock.getTime() - row.ageMinutes * 60000).toISOString();
    out.lookup = { status: 'verified', order: {
      orderId: row.orderId, paymentStatus: row.paymentStatus,
      shippingStatus: row.shippingStatus, asOf, source: 'fictional_demo_order_store',
    } };
    return out;
  }

  return { lookup };
}
return { json: supportCore().lookup($json) };
