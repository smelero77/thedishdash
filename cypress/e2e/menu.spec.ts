describe('Flujo de menú y carrito', () => {
  it('carga la página de menú, añade un ítem al carrito y muestra el modal', () => {
    cy.visit('/menu');

    // Espera a que cargue algún item y haz clic
    cy.get('[data-test=menu-item]').first().click();

    // Comprueba que el modal de modificadores aparece
    cy.get('[data-test=modifier-modal]').should('be.visible');

    // Cierra el modal si tiene un botón
    cy.get('[data-test=modifier-close]').click();

    // Asegúrate de que el contador de carrito aumentó
    cy.get('[data-test=cart-count]').should('not.have.text', '0');
  });
}); 