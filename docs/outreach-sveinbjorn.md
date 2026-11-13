# Drög að skilaboðum til Sveinbjörns Þórðarsonar

Tilgangur: að sýna Sveinbirni virðingu og láta hann vita af TS/edge-portinu
áður en það fer á npm. Höfundur iceaddr, netfang sveinbjorn@sveinbjorn.org.
Jökull Sólberg er með opið PR á iceaddr og getur verið milliliður á Discord.

**Sendu EKKI sjálfvirkt.** Veldu rás (Discord gegnum Jökul eða tölvupóst),
lagaðu að þér og sendu sjálf(ur).

---

## Stutt útgáfa (Discord / Messenger)

> Sæll Sveinbjörn,
>
> Ég heiti Guðröður og hef notað iceaddr mikið, frábært verkfæri. Við erum að
> byggja nýtt félagakerfi á Cloudflare Workers (TypeScript) og þar var ekkert
> edge-tækt ígildi af iceaddr til, svo ég endurútfærði gagnalagið í hreinu TS:
> sækir Staðfangaskrá beint frá HMS, hreinsar eins og iceaddr gerir, og býður
> leit/validation í minni. Engin gögn fylgja pakkanum nema póstnúmeratafla sem
> ég portaði úr iceaddr (BSD-3, ég held copyright-tilkynningunni og kreditt-i
> þig áberandi).
>
> Mig langar að gefa þetta út opinberlega (MIT) til að gefa til baka. Áður en
> ég set það á npm langaði mig að heyra í þér: ertu sáttur við þetta? Einhverjar
> óskir um nafn eða kredit? Og ef þú vilt mætti alveg tengja á það úr iceaddr.
>
> Takk fyrir iceaddr, kær kveðja, Guðröður

---

## Lengri útgáfa (tölvupóstur)

Yfirfarinn af Gemini (íslenska) 2026-06-20 — þetta er útgáfan sem er í Gmail-drögunum.

> Efni: TypeScript-yfirfærsla á iceaddr-gagnalaginu og fyrirspurn
>
> Sæll Sveinbjörn,
>
> Ég heiti Guðröður Atli Jónsson. Ég hef lengi notað iceaddr og vil byrja á því
> að þakka kærlega fyrir það, enda hefur verkið sparað mörgum okkar ómælda vinnu.
>
> Tilefnið er það að við erum að endurbyggja félagakerfi Sósíalistaflokksins á
> Cloudflare Workers (TypeScript, V8 isolates). Þar er hvorki Python né SQLite að
> finna, svo iceaddr var ekki beint nothæft í sinni upprunalegu mynd. Ég
> endurútfærði því gagnalagið í hreinu TypeScript:
>
> - Það sækir Staðfangaskrá beint frá opinberum endapunkti HMS á keyrslutíma
>   (engin heimilisfangagögn fylgja pakkanum).
> - Það hreinsar raðir með sömu reglum og iceaddr (Íslands-hnit, þekkt póstnúmer,
>   skiptir kommu út fyrir punkt o.s.frv.).
> - Það býður upp á leit (með forskeyti húsnúmera), staðfestingu og uppflettingu
>   eftir hnitnum, allt í vinnsluminni án gagnagrunns.
>
> Eina gagnasettið sem fylgir með er póstnúmeratafla sem ég færði beint úr iceaddr
> (postcodes.py). Hún er undir BSD-3 leyfinu og ég held höfundarréttartilkynningunni
> þinni inni, auk þess sem ég get iceaddr rækilega í README- og NOTICE-skjölunum.
>
> Pakkinn er hér (ekki enn kominn á npm): https://github.com/gudrodur/stadfangaskra
>
> Mig langar að gefa þetta út opinberlega undir MIT-leyfi til að skila einhverju
> til baka til samfélagsins. Áður en það fer á npm langaði mig að heyra í þér, af
> virðingu við upprunalega verkið:
>
> 1. Ertu sáttur við að ég gefi þetta út?
> 2. Hefurðu einhverjar óskir varðandi nafn eða hvernig ég vísa í þig? Ég stefni á
>    hlutlausa nafnið „stadfangaskra" frekar en „iceaddr-ts", einmitt til að eigna
>    mér ekki þitt nafn.
> 3. Ef þér líst vel á, mætti gjarnan tengja í pakkann úr iceaddr, eða ég gæti haft
>    tilvísun í hann sem TypeScript-yfirfærslu, allt eftir því hvað þér hentar.
>
> Ég set Jökul Sólberg (sem er með opna breytingartillögu hjá þér) í afrit, en
> hann þekkir til og benti mér á tsdown.
>
> Kær kveðja og takk aftur fyrir iceaddr,
> Guðröður
