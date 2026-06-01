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
    /* Force footer visibility when items exist */
    if (cart.length) $('#cartFooter').show();
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

  /* ========== CHECKOUT ========== */
  function openInstagramApp() {
    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      /* Try deep link first, fallback to web after 1s */
      setTimeout(function() {
        window.location.href = 'https://www.instagram.com/direct/inbox/';
      }, 1000);
      window.location.href = 'instagram://direct/inbox';
    } else {
      window.open('https://www.instagram.com/direct/inbox/', '_blank');
    }
  }

  function openWhatsApp() {
    var msg = '';
    var total = 0;
    $.each(cart, function(i, item) {
      var sub = item.price * item.qty;
      total += sub;
      msg += '• ' + item.name + ' x' + item.qty + ' = $' + Number(sub).toLocaleString('es-AR') + '\n';
    });
    msg += '\nTotal: $' + Number(total).toLocaleString('es-AR');
    var encoded = encodeURIComponent('¡Hola E3D! Quiero hacer este pedido:\n\n' + msg);
    window.open('https://wa.me/5493410000000?text=' + encoded, '_blank');
  }

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

    /* Copy to clipboard */
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg).catch(function() { fallbackCopy(msg); });
    } else {
      fallbackCopy(msg);
    }

    closeCart();

    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    var $modal = $(
      '<div class="checkout-modal-overlay">' +
        '<div class="checkout-modal">' +
          '<div class="checkout-modal-icon">&#9989;</div>' +
          '<h3>Pedido listo</h3>' +
          '<p>El mensaje ya está copiado. Elegí cómo enviarlo:</p>' +
          '<div class="checkout-modal-actions">' +
            '<button class="btn-primary checkout-open-ig">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5" fill="#0d0d0d"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>' +
              ' Instagram' +
            '</button>' +
            '<button class="btn-secondary checkout-open-wa">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
              ' WhatsApp' +
            '</button>' +
          '</div>' +
          (isMobile ? '<p class="checkout-modal-note">Se abre la app, pega el mensaje y envialo</p>' : '<p class="checkout-modal-note">Pegá el mensaje en el chat de @emet3d</p>') +
        '</div>' +
      '</div>'
    ).appendTo('body').css('display', 'flex').hide().fadeIn(200);

    $modal.find('.checkout-open-ig').on('click', function() {
      removeModal();
      openInstagramApp();
    });

    $modal.find('.checkout-open-wa').on('click', function() {
      removeModal();
      openWhatsApp();
    });

    $modal.on('click', function(e) {
      if (e.target === this) removeModal();
    });

    function removeModal() {
      $modal.fadeOut(200, function() { $modal.remove(); });
    }
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

  /* Click special card -> catalog */
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

  /* Safety: force footer visible if cart has items */
  if (cart.length) $('#cartFooter').show();

  /* Auto-select first catalog item to show its image */
  $('.catalog-item.active').trigger('click');

});
