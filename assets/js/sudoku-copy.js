/* Viking Fitness — localized dynamic copy for Viking Sudoku */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VFSudokuCopy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  return {
    es:{
      easy:'Fácil',medium:'Medio',hard:'Difícil',completedLabel:'completado',rowColumn:'Fila {row}, columna {column}',newBoard:'Nuevo tablero preparado.',lost:'Partida perdida. Reinicia el tablero o elige otro.',chooseCell:'Elige una casilla vacía.',fixedCell:'Esa casilla pertenece al tablero.',threeMistakes:'Has hecho 3 fallos. Partida perdida.',reset:'Tablero reiniciado.',progress:'Vas por {filled}/81. Sigue adelante.',complete:'Completado en {time}.',sendingCode:'Enviando código...',sendCodeFailed:'No se pudo enviar el código. Tu progreso local está a salvo.',codeSent:'Código enviado. Revisa tu email.',wrongCode:'Código incorrecto o caducado.',loginSuccess:'Sesión iniciada.',logout:'Sesión cerrada.',online:'Online: {email}',loginPrompt:'Regístrate para guardar online',offline:'La sincronización no está disponible. Tu progreso seguirá guardado en este navegador.',installReady:'Instalar',installUnavailable:'Puedes seguir jugando en el navegador.'
    },
    en:{
      easy:'Easy',medium:'Medium',hard:'Hard',completedLabel:'completed',rowColumn:'Row {row}, column {column}',newBoard:'New board ready.',lost:'Game lost. Reset the board or choose another.',chooseCell:'Choose an empty cell.',fixedCell:'That cell is part of the original board.',threeMistakes:'Three mistakes. Game lost.',reset:'Board reset.',progress:'You have filled {filled}/81 cells. Keep going.',complete:'Completed in {time}.',sendingCode:'Sending code...',sendCodeFailed:'The code could not be sent. Your local progress is safe.',codeSent:'Code sent. Check your email.',wrongCode:'The code is incorrect or has expired.',loginSuccess:'Signed in.',logout:'Signed out.',online:'Online: {email}',loginPrompt:'Sign up to save online',offline:'Sync is unavailable. Your progress will remain saved in this browser.',installReady:'Install',installUnavailable:'You can keep playing in the browser.'
    },
    fi:{
      easy:'Helppo',medium:'Keskitaso',hard:'Vaikea',completedLabel:'valmis',rowColumn:'Rivi {row}, sarake {column}',newBoard:'Uusi ruudukko valmis.',lost:'Peli hävitty. Nollaa ruudukko tai valitse toinen.',chooseCell:'Valitse tyhjä ruutu.',fixedCell:'Tämä ruutu kuuluu alkuperäiseen ruudukkoon.',threeMistakes:'Kolme virhettä. Peli hävitty.',reset:'Ruudukko nollattu.',progress:'Olet täyttänyt {filled}/81 ruutua. Jatka.',complete:'Valmis ajassa {time}.',sendingCode:'Lähetetään koodia...',sendCodeFailed:'Koodia ei voitu lähettää. Paikallinen edistymisesi on turvassa.',codeSent:'Koodi lähetetty. Tarkista sähköpostisi.',wrongCode:'Koodi on väärä tai vanhentunut.',loginSuccess:'Kirjautuminen onnistui.',logout:'Kirjauduttu ulos.',online:'Online: {email}',loginPrompt:'Rekisteröidy tallentaaksesi verkkoon',offline:'Synkronointi ei ole käytettävissä. Edistyminen tallentuu edelleen tähän selaimeen.',installReady:'Asenna',installUnavailable:'Voit jatkaa pelaamista selaimessa.'
    },
    no:{
      easy:'Enkel',medium:'Middels',hard:'Vanskelig',completedLabel:'fullført',rowColumn:'Rad {row}, kolonne {column}',newBoard:'Nytt brett er klart.',lost:'Spillet er tapt. Nullstill brettet eller velg et annet.',chooseCell:'Velg en tom rute.',fixedCell:'Denne ruten tilhører det opprinnelige brettet.',threeMistakes:'Tre feil. Spillet er tapt.',reset:'Brettet er nullstilt.',progress:'Du har fylt {filled}/81 ruter. Fortsett.',complete:'Fullført på {time}.',sendingCode:'Sender kode...',sendCodeFailed:'Koden kunne ikke sendes. Den lokale fremgangen er trygg.',codeSent:'Koden er sendt. Sjekk e-posten din.',wrongCode:'Koden er feil eller utløpt.',loginSuccess:'Du er logget inn.',logout:'Du er logget ut.',online:'Online: {email}',loginPrompt:'Registrer deg for å lagre på nett',offline:'Synkronisering er ikke tilgjengelig. Fremgangen lagres fortsatt i denne nettleseren.',installReady:'Installer',installUnavailable:'Du kan fortsette å spille i nettleseren.'
    }
  };
});
