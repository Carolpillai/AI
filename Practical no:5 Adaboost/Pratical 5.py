import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import AdaBoostClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt

df = pd.read_csv("iris.csv")
df = df.drop(columns=["Id"])

X = df.drop(columns=["Species"])
y = df["Species"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)

stump = DecisionTreeClassifier(max_depth=1, random_state=42)
stump.fit(X_train, y_train)
stump_pred = stump.predict(X_test)
stump_acc = accuracy_score(y_test, stump_pred)

ada = AdaBoostClassifier(estimator=DecisionTreeClassifier(max_depth=1), n_estimators=50, random_state=42)
ada.fit(X_train, y_train)
ada_pred = ada.predict(X_test)
ada_acc = accuracy_score(y_test, ada_pred)

print(f"Single Decision Stump Accuracy: {stump_acc:.4f}")
print(f"AdaBoost Ensemble Accuracy: {ada_acc:.4f}")
print()
print("AdaBoost Classification Report:")
print(classification_report(y_test, ada_pred))
print("AdaBoost Confusion Matrix:")
print(confusion_matrix(y_test, ada_pred))
print()

n_range = [1, 5, 10, 20, 30, 50, 75, 100]
accs = []
for n in n_range:
    m = AdaBoostClassifier(estimator=DecisionTreeClassifier(max_depth=1), n_estimators=n, random_state=42)
    m.fit(X_train, y_train)
    accs.append(accuracy_score(y_test, m.predict(X_test)))
    print(f"n_estimators={n}: accuracy={accs[-1]:.4f}")

print()
print("Individual Weak Learner Accuracies (first 10 stumps):")
for i, est in enumerate(ada.estimators_[:10]):
    p = est.predict(X_test.values)
    print(f"Stump {i+1}: accuracy={accuracy_score(y_test, p):.4f}, weight={ada.estimator_weights_[i]:.4f}")

plt.figure(figsize=(8, 5))
plt.plot(n_range, accs, marker="o", label="AdaBoost")
plt.axhline(y=stump_acc, color="r", linestyle="--", label="Single Stump")
plt.xlabel("Number of Estimators")
plt.ylabel("Test Accuracy")
plt.title("AdaBoost Accuracy vs Number of Weak Learners")
plt.legend()
plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig("adaboost_comparison.png", dpi=150)
print("Saved adaboost_comparison.png")
