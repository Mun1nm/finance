import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { 
  collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc, onSnapshot 
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export function useSubscriptions() {
  const { currentUser, userProfile } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. LISTAR
  useEffect(() => {
    if (!currentUser || !userProfile?.isAuthorized) {
        setSubscriptions([]);
        setLoading(false);
        return;
    }
    const q = query(collection(db, "subscriptions"), where("uid", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubscriptions(data);
      setLoading(false);
    }, (error) => {
        console.log("Erro ao buscar assinaturas", error);
    });
    return unsubscribe;
  }, [currentUser, userProfile]);

  // 2. CRIAR
  const createSubscription = async (amount, category, macro, name, type, day, walletId, initialPaymentMade, paymentMethod = 'debit') => {
    if (!currentUser || !userProfile?.isAuthorized) return;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Se já pagou, marca o mês atual. Se não, marca o mês anterior para o loop pegar o atual na próxima vez.
    const lastMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastYearIdx = currentMonth === 0 ? currentYear - 1 : currentYear;

    await addDoc(collection(db, "subscriptions"), {
      uid: currentUser.uid,
      amount: parseFloat(amount),
      category,
      macro,
      name, 
      type, 
      day: parseInt(day),
      walletId: walletId || null,
      paymentMethod, 
      lastProcessedMonth: initialPaymentMade ? currentMonth : lastMonthIdx,
      lastProcessedYear: initialPaymentMade ? currentYear : lastYearIdx, // Novo campo para segurança
      active: true
    });
  };

  // 3. ATUALIZAR
  const updateSubscription = async (id, newData) => {
    if (!userProfile?.isAuthorized) return;
    const docRef = doc(db, "subscriptions", id);
    await updateDoc(docRef, newData);
  };

  // 4. TOGGLE
  const toggleSubscription = async (id, currentStatus) => {
    if (!userProfile?.isAuthorized) return;
    const docRef = doc(db, "subscriptions", id);
    await updateDoc(docRef, { active: !currentStatus });
  };

  // 5. DELETAR
  const deleteSubscription = async (id) => {
    if (!userProfile?.isAuthorized) return;
    await deleteDoc(doc(db, "subscriptions", id));
  };

  // Helper para calcular data da fatura
  const getInvoiceDate = (dateObj, closingDay) => {
      const day = dateObj.getDate();
      let month = dateObj.getMonth();
      let year = dateObj.getFullYear();

      // Se a transação é no dia do fechamento ou depois, vai para a próxima fatura
      if (day >= closingDay) {
          month++;
          if (month > 11) {
              month = 0;
              year++;
          }
      }
      return `${year}-${String(month + 1).padStart(2, '0')}`;
  };

  // 6. PROCESSAR (CORRIGIDO: Loop While para pegar meses retroativos)
  const processSubscriptions = async (addTransactionFn, wallets) => {
    if (!currentUser || !userProfile?.isAuthorized) return;
    
    const today = new Date();
    // Zera a hora para evitar problemas de fuso/comparação
    today.setHours(0, 0, 0, 0);
    
    const q = query(collection(db, "subscriptions"), where("uid", "==", currentUser.uid), where("active", "==", true));
    const snapshot = await getDocs(q);

    for (const subDoc of snapshot.docs) {
      const sub = subDoc.data();
      
      // --- LÓGICA DE RECONSTRUÇÃO DA ÚLTIMA DATA ---
      let lastProcessedYear = sub.lastProcessedYear;
      
      // Fallback para assinaturas antigas que não tinham o campo 'year'
      if (!lastProcessedYear) {
          const currentYear = today.getFullYear();
          // Se o último mês processado (ex: Dezembro/11) é maior que o mês atual (ex: Janeiro/0),
          // assumimos que foi ano passado.
          if (sub.lastProcessedMonth > today.getMonth()) {
              lastProcessedYear = currentYear - 1;
          } else {
              lastProcessedYear = currentYear;
          }
      }

      // Data do último processamento
      // Usamos o dia '1' ou 'sub.day' apenas para estabelecer o mês/ano corretamente
      // Mas para o loop, vamos criar a data "Alvo" inicial sendo o último processamento
      let lastDate = new Date(lastProcessedYear, sub.lastProcessedMonth, sub.day);
      
      // A próxima data devida é 1 mês depois da última
      let nextDueDate = new Date(lastDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      
      // Ajuste fino para manter o dia correto (ex: se era dia 15, mantém dia 15)
      // JS faz roll-over automático (31 Jan + 1 mês -> 3 Março), então forçamos o dia se possível
      // Mas para simplificar e evitar loop infinito em dia 31, vamos confiar na data gerada, 
      // mas tentar setar o dia original se o mês permitir.
      const desiredDay = sub.day;
      const daysInNextMonth = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth() + 1, 0).getDate();
      if (desiredDay <= daysInNextMonth) {
          nextDueDate.setDate(desiredDay);
      } else {
          nextDueDate.setDate(daysInNextMonth); // Trava no último dia (ex: 30 ou 28)
      }

      // --- LOOP: Enquanto a próxima data devida for hoje ou passado ---
      while (nextDueDate <= today) {
        
        // 1. Calcular detalhes do pagamento (Crédito/Débito)
        let invoiceDate = null;
        let paymentMethod = sub.paymentMethod || 'debit';

        if (paymentMethod === 'credit' && sub.walletId && wallets) {
            const wallet = wallets.find(w => w.id === sub.walletId);
            if (wallet && wallet.hasCredit && wallet.closingDay) {
                // Passamos o nextDueDate (data da cobrança), não o today
                invoiceDate = getInvoiceDate(nextDueDate, parseInt(wallet.closingDay));
            } else {
                paymentMethod = 'debit';
            }
        }

        // 2. Criar a transação
        await addTransactionFn(
          sub.amount, 
          sub.category, 
          sub.macro,    
          sub.type || 'expense',
          false,        
          `Assinatura Mensal: ${sub.name}`,
          nextDueDate.toLocaleDateString('en-CA'), // Usa a data da recorrência, não hoje
          sub.walletId,
          subDoc.id, 
          paymentMethod, 
          invoiceDate    
        );

        // 3. Atualizar o banco para este mês específico (segurança contra falhas no meio do loop)
        await updateDoc(doc(db, "subscriptions", subDoc.id), { 
            lastProcessedMonth: nextDueDate.getMonth(),
            lastProcessedYear: nextDueDate.getFullYear()
        });

        // 4. Avançar para o próximo mês
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        
        // Reajuste do dia (mesma lógica acima)
        const daysInFutureMonth = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth() + 1, 0).getDate();
        if (desiredDay <= daysInFutureMonth) {
            nextDueDate.setDate(desiredDay);
        } else {
            nextDueDate.setDate(daysInFutureMonth);
        }
      }
    }
  };

  return { subscriptions, loading, createSubscription, updateSubscription, processSubscriptions, toggleSubscription, deleteSubscription };
}