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

> Efni: TypeScript-port af gagnalagi iceaddr, vildi heyra í þér fyrst
>
> Sæll Sveinbjörn,
>
> Ég heiti Guðröður Atli Jónsson. Ég hef lengi notað iceaddr og vil byrja á að
> þakka fyrir það, það er búið að spara mörgum okkar ómælda vinnu.
>
> Tilefnið: við erum að endurbyggja félagakerfi Sósíalistaflokksins á Cloudflare
> Workers (TypeScript, V8 isolates). Þar er enginn Python og ekkert SQLite, svo
> iceaddr var ekki nothæft beint. Ég endurútfærði því gagnalagið í hreinu
> TypeScript:
>
> - sækir Staðfangaskrá beint frá opinbera HMS-endapunktinum á keyrslutíma (engin
>   heimilisfangagögn fylgja pakkanum),
> - hreinsar raðir með sömu reglum og iceaddr (Íslands-hnit, þekkt póstnúmer,
>   komma í punkt o.s.frv.),
> - býður leit (með húsnúmera-prefix), validation og uppflettingu eftir hnitnum,
>   allt í minni, án gagnagrunns.
>
> Eina gagnasettið sem fylgir er póstnúmeratafla sem ég portaði beint úr iceaddr
> (postcodes.py). Hún er BSD-3, og ég held copyright-tilkynningunni þinni inni og
> kredit-a iceaddr áberandi í README og NOTICE.
>
> Mig langar að gefa þetta út opinberlega undir MIT, til að skila einhverju til
> baka til samfélagsins. Áður en það fer á npm langaði mig að heyra í þér fyrst,
> af virðingu við upprunalega verkið:
>
> 1. Ertu sáttur við að ég gefi þetta út?
> 2. Einhverjar óskir varðandi nafn eða hvernig ég kredit-a þig? (Ég stefni á
>    hlutlausa nafnið „stadfangaskra" frekar en „iceaddr-ts", einmitt til að
>    eigna mér ekki nafnið þitt.)
> 3. Ef þér líst vel á, mætti gjarnan tengja á það úr iceaddr, eða ég gæti haft
>    það sem „TS port" tilvísun, eins og þú vilt.
>
> Jökull Sólberg (sem er með opið PR hjá þér) þekkir þetta og benti mér á tsdown.
>
> Kær kveðja og takk aftur fyrir iceaddr,
> Guðröður
