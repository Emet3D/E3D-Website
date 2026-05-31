$(function() {

  /* ========== CART ========== */
  var cart = JSON.parse(localStorage.getItem('e3d_cart') || '[]');

  function saveCart() {
    localStorage.setItem('e3d_cart', JSON.stringify(cart));
    updateCartUI();
  }

  function formatPrice(n) {
    return '$' + Number(n).toLocaleString('es-AR');
  }

  function updateCartUI() {
    var count = cart.reduce(function(s, i) { return s + i.qty; }, 0);
    var $badge = $('#cartCount');
    $badge.text(count);
    $badge.toggle(count > 0);
    renderCartItems();
  }

  function sanitize(str) {
    return String(str).replace(/[&<>"']/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      if (m === '"') return '&quot;';
      if (m === "'") return '&#39;';
      return m;
    });
  }

  function renderCartItems() {
    var $container = $('#cartItems');
    if (!cart.length) {
      $container.html('<div class="cart-empty">' +
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
        '<p style="margin-top:12px">Tu carrito está vacío</p>' +
        '<a href="#catalogo" class="btn-empty-cart">Ver catálogo</a>' +
        '</div>');
      $('#cartFooter').fadeOut(200);
      return;
    }
    var html = '';
    var total = 0;
    $.each(cart, function(i, item) {
      total += item.price * item.qty;
      html += '<div class="cart-item" data-idx="' + i + '">' +
        '<div class="cart-item-img">' + (item.thumb || '&#128241;') + '</div>' +
        '<div class="cart-item-info">' +
          '<h4>' + sanitize(item.name) + '</h4>' +
          '<div class="cart-item-price">' + formatPrice(item.price) + '</div>' +
        '</div>' +
        '<div class="cart-item-qty">' +
          '<button class="qty-minus">&#8722;</button>' +
          '<span>' + item.qty + '</span>' +
          '<button class="qty-plus">+</button>' +
        '</div>' +
        '<button class="cart-item-remove" title="Eliminar">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button></div>';
    });
    $container.html(html);
    $('#cartTotal').text(formatPrice(total));
    $('#cartFooter').fadeIn(200);
  }

  function addToCart(id, name, price, qty, thumb) {
    qty = qty || 1;
    var found = false;
    $.each(cart, function(i, item) {
      if (item.id === id) { item.qty += qty; item.price = Number(price); found = true; return false; }
    });
    if (!found) {
      cart.push({ id: id, name: name, price: Number(price), qty: qty, thumb: thumb || '' });
    }
    saveCart();
    openCart();
    var msg = name + (qty > 1 ? ' x' + qty : '') + ' agregado al carrito';
    showToast(msg);
  }

  function removeFromCart(idx) {
    cart.splice(idx, 1);
    saveCart();
  }

  function changeQty(idx, delta) {
    if (idx < 0 || idx >= cart.length) return;
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) { cart.splice(idx, 1); }
    saveCart();
  }

  function clearCart() {
    if (!cart.length) return;
    if (confirm('¿Vaciar carrito?')) {
      cart = [];
      saveCart();
      showToast('Carrito vaciado');
    }
  }

  /* Cart sidebar */
  function openCart() {
    $('#cartSidebar').addClass('open');
    $('#cartOverlay').fadeIn(300).addClass('show');
    $('body').css('overflow', 'hidden');
  }

  function closeCart() {
    $('#cartSidebar').removeClass('open');
    $('#cartOverlay').fadeOut(300).removeClass('show');
    $('body').css('overflow', '');
  }

  function showToast(msg) {
    var $t = $('<div class="toast"></div>').text(msg).appendTo('body');
    setTimeout(function() { $t.addClass('toast-show'); }, 10);
    setTimeout(function() {
      $t.removeClass('toast-show');
      setTimeout(function() { $t.remove(); }, 400);
    }, 2200);
  }

  /* Cart event delegation */
  $('#cartToggle').on('click', function() {
    $('#cartSidebar').hasClass('open') ? closeCart() : openCart();
  });

  $('#cartClose, #cartOverlay').on('click', closeCart);

  $('#cartItems')
    .on('click', '.qty-plus', function() { changeQty($(this).closest('.cart-item').data('idx'), 1); })
    .on('click', '.qty-minus', function() { changeQty($(this).closest('.cart-item').data('idx'), -1); })
    .on('click', '.cart-item-remove', function() { removeFromCart($(this).closest('.cart-item').data('idx')); })
    .on('click', '.btn-empty-cart', function(e) { e.preventDefault(); closeCart(); $('html, body').animate({ scrollTop: $('#catalogo').offset().top - 80 }, 600); });

  $('#clearCartBtn').on('click', clearCart);

  /* Checkout: copy to clipboard (modern API) + open Instagram */
  $('#checkoutBtn').on('click', function() {
    if (!cart.length) return;
    var lines = ['¡Hola E3D! Quiero hacer este pedido:\n'];
    var total = 0;
    $.each(cart, function(i, item) {
      var sub = item.price * item.qty;
      total += sub;
      lines.push('• ' + item.name + ' x' + item.qty + ' = ' + formatPrice(sub));
    });
    lines.push('\nTotal: ' + formatPrice(total));
    lines.push('\n📍 Envío a coordinar');
    lines.push('\n✅ Pedido generado desde e3d.com.ar');
    var msg = lines.join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).catch(function() { fallbackCopy(msg); });
    } else {
      fallbackCopy(msg);
    }

    closeCart();
    setTimeout(function() {
      window.open('https://www.instagram.com/emet3d/', '_blank');
    }, 300);
    showToast('Pedido copiado ✓ Abriendo Instagram...');
  });

  function fallbackCopy(text) {
    var $ta = $('<textarea>').val(text).css({ position: 'fixed', left: '-9999px', top: '-9999px' }).appendTo('body');
    $ta.select();
    try { document.execCommand('copy'); } catch (e) { }
    $ta.remove();
  }

  /* ========== QTY SELECTOR (tiered products) ========== */
  function getTieredPrice(qty) {
    if (qty >= 10) return 1200;
    if (qty >= 5) return 1500;
    return 2000;
  }

  function updateQtySelector($feat) {
    var qty = parseInt($feat.find('.qty-value').text()) || 1;
    var unitPrice = getTieredPrice(qty);
    var total = unitPrice * qty;
    var $total = $feat.find('.qty-total');
    if (qty >= 10) {
      $total.text(formatPrice(total) + ' ($1.200 c/u)');
    } else if (qty >= 5) {
      $total.text(formatPrice(total) + ' ($1.500 c/u)');
    } else {
      $total.text('= ' + formatPrice(total));
    }
    $feat.find('.btn-add-cart').data('qty', qty);
  }

  $('.catalog-featured').on('click', '.qty-minus', function() {
    var $feat = $(this).closest('.catalog-featured');
    var $val = $feat.find('.qty-value');
    var v = Math.max(1, (parseInt($val.text()) || 1) - 1);
    $val.text(v); updateQtySelector($feat);
  });

  $('.catalog-featured').on('click', '.qty-plus', function() {
    var $feat = $(this).closest('.catalog-featured');
    var $val = $feat.find('.qty-value');
    var v = Math.min(999, (parseInt($val.text()) || 1) + 1);
    $val.text(v); updateQtySelector($feat);
  });

  /* ========== ADD TO CART: catalog featured ========== */
  $('.btn-add-cart').on('click', function() {
    var $b = $(this);
    var qty = $b.data('qty') || 1;
    var price = $b.data('price');
    var $feat = $('.catalog-featured');
    if ($feat.find('.qty-selector').is(':visible')) {
      price = getTieredPrice(qty);
    }
    addToCart($b.data('id'), $b.data('name'), price, qty);
  });

  /* ========== ADD TO CART: catalog list items (+) ========== */
  $('.catalog-list').on('click', '.btn-sm-cart', function(e) {
    e.stopPropagation();
    var $item = $(this).closest('.catalog-item');
    addToCart($item.data('id'), $item.data('name'), $item.data('price-num'));
  });

  /* ========== ADD TO CART: variant carousel (+) ========== */
  $('.carousel-track').on('click', '.variant-add', function(e) {
    e.stopPropagation();
    var $card = $(this).closest('.carousel-card');
    addToCart($card.data('id'), $card.data('name'), $card.data('price'));
  });

  /* ========== CATALOG TABS ========== */
  $('.catalog-tabs').on('click', '.catalog-tab', function() {
    var $tab = $(this).addClass('active');
    $tab.siblings().removeClass('active');
    var cat = $tab.data('cat');

    $('.catalog-list .catalog-item').each(function() {
      var $item = $(this);
      if (cat === 'todo' || $item.data('category') === cat) {
        $item.removeClass('hidden-by-tab');
      } else {
        $item.addClass('hidden-by-tab');
      }
    });

    /* Click first visible item */
    var $first = $('.catalog-list .catalog-item:not(.hidden-by-tab)').first();
    if ($first.length) {
      $first.trigger('click');
    }
  });

  /* ========== CATALOG ITEM SELECTION ========== */
  $('.catalog-list').on('click', '.catalog-item:not(.hidden-by-tab)', function() {
    var $this = $(this);
    $('.catalog-item').removeClass('active');
    $this.addClass('active');

    var $feat = $('.catalog-featured');
    var $img = $feat.find('.product-image img');
    var $placeholder = $feat.find('.placeholder-icon');
    var url = $this.data('img');

    /* Coming soon */
    if ($this.data('coming-soon')) {
      $img.addClass('hidden').attr('src', '');
      $placeholder.show();
      $feat.find('.category').text($this.data('category'));
      $feat.find('h3').text($this.data('name'));
      $feat.find('.desc').text($this.data('desc'));
      $feat.find('.price').text('PRÓXIMAMENTE').css('color', 'var(--text-dim)');
      $feat.find('.qty-selector').hide();
      $feat.find('.variant-selector').hide();
      $feat.find('.btn-add-cart').hide();
      return;
    }

    $feat.find('.btn-add-cart').show();
    $feat.find('.price').css('color', '');

    if (url && url.length) {
      $img.attr('src', url).attr('alt', $this.data('name')).removeClass('hidden');
      $placeholder.hide();
    }

    $feat.find('.category').text($this.data('category'));
    $feat.find('h3').text($this.data('name'));
    $feat.find('.desc').text($this.data('desc'));
    $feat.find('.price').text($this.data('price'));

    var $btn = $feat.find('.btn-add-cart');
    $btn.data('id', $this.data('id'));
    $btn.data('name', $this.data('name'));
    $btn.data('price', $this.data('price-num'));
    $btn.data('qty', 1);

    /* Qty selector for tiered pricing */
    var $qtySel = $feat.find('.qty-selector');
    if ($this.data('tiered')) {
      $qtySel.show();
      $qtySel.find('.qty-value').text(1);
      $qtySel.find('.qty-total').text('');
    } else {
      $qtySel.hide();
    }

    /* Variant selector */
    var variants = $this.data('variants');
    var $vsel = $feat.find('.variant-selector');
    var $vopts = $vsel.find('.variant-options');

    if (variants && variants.length) {
      var vdata = (typeof variants === 'string') ? JSON.parse(variants) : variants;
      var html = '';
      $.each(vdata, function(i, v) {
        html += '<button class="variant-option' + (i === 0 ? ' active' : '') + '" data-vid="' + v.id + '" data-vname="' + v.name + '" data-vimg="' + v.img + '" data-vprice="' + v.price + '" data-vprice-label="' + v.priceLabel + '">' + v.label + '</button>';
      });
      $vopts.html(html);
      /* Set featured to first variant */
      var $first = $vopts.find('.variant-option').first();
      $feat.find('h3').text($first.data('vname'));
      $feat.find('.price').text($first.data('vprice-label'));
      $btn.data('id', $first.data('vid'));
      $btn.data('name', $first.data('vname'));
      $btn.data('price', $first.data('vprice'));
      if ($first.data('vimg')) {
        $img.attr('src', $first.data('vimg')).attr('alt', $first.data('vname'));
      }
      $vsel.show();
    } else {
      $vsel.hide();
    }
  });

  /* ========== VARIANT OPTION CLICK ========== */
  $('.catalog-featured').on('click', '.variant-option', function() {
    var $opt = $(this);
    if ($opt.hasClass('active')) return;

    $opt.closest('.variant-options').find('.variant-option').removeClass('active');
    $opt.addClass('active');

    var $feat = $('.catalog-featured');
    var $img = $feat.find('.product-image img');
    var name = $opt.data('vname');
    var img = $opt.data('vimg');
    var price = $opt.data('vprice');
    var priceLabel = $opt.data('vprice-label');

    $img.attr('src', img).attr('alt', name);
    $feat.find('h3').text(name);
    $feat.find('.price').text(priceLabel);

    var $btn = $feat.find('.btn-add-cart');
    $btn.data('id', $opt.data('vid'));
    $btn.data('name', name);
    $btn.data('price', price);
    $btn.data('qty', 1);
    $feat.find('.qty-value').text(1);
    $feat.find('.qty-total').text('');
  });

  /* ========== HAMBURGER ========== */
  var $hamburger = $('.hamburger');
  var $navLinks = $('.nav-links');
  var $navOverlay = $('<div class="mobile-overlay"></div>').appendTo('body');

  function closeMenu() {
    $hamburger.removeClass('active');
    $navLinks.removeClass('open');
    $navOverlay.removeClass('show').fadeOut(300);
    $('body').css('overflow', '');
  }

  $hamburger.on('click', function() {
    $(this).toggleClass('active');
    $navLinks.toggleClass('open');
    if ($navLinks.hasClass('open')) {
      $navOverlay.fadeIn(300).addClass('show');
      $('body').css('overflow', 'hidden');
    } else { closeMenu(); }
  });

  $navOverlay.on('click', closeMenu);
  $navLinks.on('click', 'a', closeMenu);

  /* ========== FADE-UP ANIMATIONS ========== */
  var $win = $(window);
  var $fade = $('.fade-up');

  function checkFade() {
    var threshold = $win.scrollTop() + $win.height() - 80;
    $fade.each(function() {
      if ($(this).offset().top < threshold) $(this).addClass('visible');
    });
  }
  checkFade();
  $win.on('scroll', checkFade);

  /* ========== SMOOTH SCROLL ========== */
  $(document).on('click', 'a[href^="#"]', function(e) {
    var target = $($(this).attr('href'));
    if (target.length) {
      e.preventDefault();
      closeMenu();
      closeCart();
      $('html, body').animate({ scrollTop: target.offset().top - 80 }, 600);
    }
  });

  /* ========== CAROUSEL ========== */
  $('.carousel-wrapper').each(function() {
    var $track = $(this).find('.carousel-track');
    var $prev = $(this).find('.carousel-btn.prev');
    var $next = $(this).find('.carousel-btn.next');

    function cardW() {
      var $c = $track.find('.carousel-card').first();
      return $c.length ? $c.outerWidth(true) : 300;
    }

    $prev.on('click', function() { $track.animate({ scrollLeft: '-=' + cardW() }, 300); });
    $next.on('click', function() { $track.animate({ scrollLeft: '+=' + cardW() }, 300); });

    var startX, scrollStart, dragging = false;
    $track.on('touchstart mousedown', function(e) {
      dragging = true;
      startX = e.type === 'touchstart' ? e.originalEvent.touches[0].pageX : e.pageX;
      scrollStart = $track.scrollLeft();
    });

    $(document).on('touchmove mousemove', function(e) {
      if (!dragging) return;
      var x = e.type === 'touchmove' ? e.originalEvent.touches[0].pageX : e.pageX;
      $track.scrollLeft(scrollStart + (startX - x));
    });

    $(document).on('touchend mouseup', function() { dragging = false; });
  });

  /* ========== SPECIAL CAROUSEL ========== */
  $('.special-carousel').each(function() {
    var $track = $(this).find('.special-track');
    var $prev = $(this).find('.special-prev');
    var $next = $(this).find('.special-next');

    function cardW() {
      var $c = $track.find('.special-card').first();
      return $c.length ? $c.outerWidth(true) : 260;
    }

    $prev.on('click', function() { $track.animate({ scrollLeft: '-=' + cardW() }, 300); });
    $next.on('click', function() { $track.animate({ scrollLeft: '+=' + cardW() }, 300); });

    var startX, scrollStart, dragging = false;
    $track.on('touchstart mousedown', function(e) {
      dragging = true;
      startX = e.type === 'touchstart' ? e.originalEvent.touches[0].pageX : e.pageX;
      scrollStart = $track.scrollLeft();
    });

    $(document).on('touchmove mousemove', function(e) {
      if (!dragging) return;
      var x = e.type === 'touchmove' ? e.originalEvent.touches[0].pageX : e.pageX;
      $track.scrollLeft(scrollStart + (startX - x));
    });

    $(document).on('touchend mouseup', function() { dragging = false; });
  });

  /* Click special card -> scroll to catalog */
  $('.special-card').on('click', function() {
    $('html, body').animate({ scrollTop: $('#catalogo').offset().top - 80 }, 600);
  });

  /* ========== RESIZE GUARD ========== */
  $win.on('resize', function() {
    if ($win.width() > 768) closeMenu();
  });

  /* ========== KEYBOARD ========== */
  $(document).on('keydown', function(e) {
    if (e.key === 'Escape') { closeCart(); closeMenu(); }
  });

  /* Init */
  updateCartUI();

  /* Auto-select first catalog item to show its image */
  $('.catalog-item.active').trigger('click');

});
